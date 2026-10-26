import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma, isDatabaseConfigured } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'azota-super-secret-jwt-key-gdpt2018';
const TOKEN_EXPIRY = '7d';

// Dedicated Super Admin Credentials (works consistently on both Localhost & Production)
export const SUPER_ADMIN_CONFIG = {
  id: 'admin-master-root',
  phone: '0999999999',
  email: 'admin@azota.vn',
  fullName: 'Quản Trị Viên (Admin Master)',
  passwordPlain: 'admin123@Azota',
  role: 'ADMIN',
};

export interface UserTokenPayload {
  userId: string;
  role: string;
  fullName: string;
}

export interface SanitizedUser {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  role: string;
  createdAt: Date;
}

export interface RegisterInput {
  fullName: string;
  phone: string;
  email?: string;
  password: string;
}

// In-memory fallback user database when PostgreSQL is not configured locally (stored on globalThis for Next.js webpack consistency)
const globalForAuth = globalThis as unknown as {
  __memoryUsers?: Map<string, {
    id: string;
    fullName: string;
    phone: string;
    email: string | null;
    passwordHash: string;
    role: string;
    createdAt: Date;
  }>;
};
const memoryUsers = globalForAuth.__memoryUsers || new Map<string, {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  passwordHash: string;
  role: string;
  createdAt: Date;
}>();
globalForAuth.__memoryUsers = memoryUsers;

export function getLocalUsers(): SanitizedUser[] {
  const list: SanitizedUser[] = [
    {
      id: SUPER_ADMIN_CONFIG.id,
      fullName: SUPER_ADMIN_CONFIG.fullName,
      phone: SUPER_ADMIN_CONFIG.phone,
      email: SUPER_ADMIN_CONFIG.email,
      role: 'ADMIN',
      createdAt: new Date('2026-01-01T00:00:00Z'),
    }
  ];
  for (const u of memoryUsers.values()) {
    list.push({
      id: u.id,
      fullName: u.fullName,
      phone: u.phone,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
    });
  }
  return list;
}

export function updateLocalUserRole(userId: string, newRole: string): SanitizedUser | null {
  const u = memoryUsers.get(userId);
  if (u) {
    u.role = newRole;
    return {
      id: u.id,
      fullName: u.fullName,
      phone: u.phone,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
    };
  }
  return null;
}

export function deleteLocalUser(userId: string): boolean {
  return memoryUsers.delete(userId);
}

export class AuthService {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  createToken(payload: UserTokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
  }

  verifyToken(token: string): UserTokenPayload | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as UserTokenPayload;
      return decoded;
    } catch {
      return null;
    }
  }

  async registerUser(input: RegisterInput): Promise<SanitizedUser> {
    const cleanPhone = input.phone.trim();
    const cleanEmail = input.email ? input.email.trim().toLowerCase() : null;

    // Prevent registering with reserved Super Admin credentials
    if (cleanPhone === SUPER_ADMIN_CONFIG.phone || (cleanEmail && cleanEmail === SUPER_ADMIN_CONFIG.email)) {
      throw new Error('Số điện thoại hoặc Email này được bảo lưu cho Quản trị viên');
    }

    // 1. Try PostgreSQL via Prisma if configured
    if (isDatabaseConfigured) {
      try {
        const existingByPhone = await prisma.user.findUnique({
          where: { phone: cleanPhone }
        });
        if (existingByPhone) {
          throw new Error('Số điện thoại đã được đăng ký');
        }

        if (cleanEmail) {
          const existingByEmail = await prisma.user.findUnique({
            where: { email: cleanEmail }
          });
          if (existingByEmail) {
            throw new Error('Email đã được đăng ký');
          }
        }

        const passwordHash = await this.hashPassword(input.password);

        // Normal users registered via UI will strictly receive USER role
        const user = await prisma.user.create({
          data: {
            fullName: input.fullName.trim(),
            phone: cleanPhone,
            email: cleanEmail,
            passwordHash,
            role: 'USER'
          }
        });

        return {
          id: user.id,
          fullName: user.fullName,
          phone: user.phone,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt
        };
      } catch (err: any) {
        if (
          err.message === 'Số điện thoại đã được đăng ký' ||
          err.message === 'Email đã được đăng ký' ||
          err.message.includes('được bảo lưu')
        ) {
          throw err;
        }
      }
    }

    // In-memory fallback
    for (const u of memoryUsers.values()) {
      if (u.phone === cleanPhone) {
        throw new Error('Số điện thoại đã được đăng ký');
      }
      if (cleanEmail && u.email === cleanEmail) {
        throw new Error('Email đã được đăng ký');
      }
    }

    const passwordHash = await this.hashPassword(input.password);
    const newId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const userRecord = {
      id: newId,
      fullName: input.fullName.trim(),
      phone: cleanPhone,
      email: cleanEmail,
      passwordHash,
      role: 'USER',
      createdAt: new Date(),
    };

    memoryUsers.set(newId, userRecord);

    return {
      id: userRecord.id,
      fullName: userRecord.fullName,
      phone: userRecord.phone,
      email: userRecord.email,
      role: userRecord.role,
      createdAt: userRecord.createdAt
    };
  }

  async loginUser(identifier: string, password: string): Promise<{ user: SanitizedUser; token: string }> {
    const cleanId = identifier.trim();

    // 0. CHECK SUPER ADMIN CREDENTIALS FIRST
    // Guarantees Admin account always works seamlessly on both Localhost and Vercel Production
    if (
      cleanId === SUPER_ADMIN_CONFIG.phone ||
      cleanId.toLowerCase() === SUPER_ADMIN_CONFIG.email.toLowerCase() ||
      cleanId.toLowerCase() === 'admin'
    ) {
      if (password === SUPER_ADMIN_CONFIG.passwordPlain) {
        const adminUser: SanitizedUser = {
          id: SUPER_ADMIN_CONFIG.id,
          fullName: SUPER_ADMIN_CONFIG.fullName,
          phone: SUPER_ADMIN_CONFIG.phone,
          email: SUPER_ADMIN_CONFIG.email,
          role: 'ADMIN',
          createdAt: new Date('2026-01-01T00:00:00Z'),
        };

        const token = this.createToken({
          userId: adminUser.id,
          role: 'ADMIN',
          fullName: adminUser.fullName,
        });

        // Optionally persist/sync admin record to DB if Prisma is available
        if (isDatabaseConfigured) {
          try {
            const existing = await prisma.user.findUnique({ where: { phone: SUPER_ADMIN_CONFIG.phone } });
            if (!existing) {
              const hash = await this.hashPassword(SUPER_ADMIN_CONFIG.passwordPlain);
              await prisma.user.create({
                data: {
                  id: SUPER_ADMIN_CONFIG.id,
                  fullName: SUPER_ADMIN_CONFIG.fullName,
                  phone: SUPER_ADMIN_CONFIG.phone,
                  email: SUPER_ADMIN_CONFIG.email,
                  passwordHash: hash,
                  role: 'ADMIN',
                }
              });
            }
          } catch {}
        }

        return { user: adminUser, token };
      } else {
        throw new Error('Mật khẩu không chính xác');
      }
    }

    // 1. Try PostgreSQL via Prisma for regular users if configured
    if (isDatabaseConfigured) {
      try {
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { phone: cleanId },
              { email: cleanId.toLowerCase() }
            ]
          }
        });

        if (user) {
          const isMatch = await this.comparePassword(password, user.passwordHash);
          if (!isMatch) {
            throw new Error('Mật khẩu không chính xác');
          }

          const sanitized: SanitizedUser = {
            id: user.id,
            fullName: user.fullName,
            phone: user.phone,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt
          };

          const token = this.createToken({
            userId: user.id,
            role: user.role,
            fullName: user.fullName
          });

          return { user: sanitized, token };
        }
      } catch (err: any) {
        if (err.message === 'Mật khẩu không chính xác') {
          throw err;
        }
      }
    }

    // 2. Check in-memory store
    for (const memUser of memoryUsers.values()) {
      if (memUser.phone === cleanId || (memUser.email && memUser.email.toLowerCase() === cleanId.toLowerCase())) {
        const isMatch = await this.comparePassword(password, memUser.passwordHash);
        if (!isMatch) {
          throw new Error('Mật khẩu không chính xác');
        }

        const sanitized: SanitizedUser = {
          id: memUser.id,
          fullName: memUser.fullName,
          phone: memUser.phone,
          email: memUser.email,
          role: memUser.role,
          createdAt: memUser.createdAt
        };

        const token = this.createToken({
          userId: memUser.id,
          role: memUser.role,
          fullName: memUser.fullName
        });

        return { user: sanitized, token };
      }
    }

    throw new Error('Tài khoản không tồn tại');
  }

  async getUserById(id: string): Promise<SanitizedUser | null> {
    if (id === SUPER_ADMIN_CONFIG.id) {
      return {
        id: SUPER_ADMIN_CONFIG.id,
        fullName: SUPER_ADMIN_CONFIG.fullName,
        phone: SUPER_ADMIN_CONFIG.phone,
        email: SUPER_ADMIN_CONFIG.email,
        role: 'ADMIN',
        createdAt: new Date('2026-01-01T00:00:00Z'),
      };
    }

    if (isDatabaseConfigured) {
      try {
        const user = await prisma.user.findUnique({
          where: { id }
        });
        if (user) {
          return {
            id: user.id,
            fullName: user.fullName,
            phone: user.phone,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt
          };
        }
      } catch {}
    }

    const mem = memoryUsers.get(id);
    if (mem) {
      return {
        id: mem.id,
        fullName: mem.fullName,
        phone: mem.phone,
        email: mem.email,
        role: mem.role,
        createdAt: mem.createdAt
      };
    }

    return null;
  }
}

export const authService = new AuthService();

export function getAuthUser(req: any): UserTokenPayload | null {
  let token: string | null = null;
  if (req?.cookies && typeof req.cookies.get === 'function') {
    token = req.cookies.get('azota_token')?.value || null;
  }
  if (!token && req?.headers) {
    const authHeader = req.headers.get ? req.headers.get('authorization') : req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      const cookieHeader = req.headers.get ? req.headers.get('cookie') : req.headers['cookie'];
      if (cookieHeader && cookieHeader.includes('azota_token=')) {
        const m = cookieHeader.match(/azota_token=([^;]+)/);
        if (m) token = m[1];
      }
    }
  }
  if (!token) return null;
  return authService.verifyToken(token);
}

export function clearMemoryUsers() { memoryUsers.clear(); }

(globalThis as any).__clearMemoryStores = () => { memoryUsers.clear(); };
