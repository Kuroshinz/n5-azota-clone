import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma, isDatabaseConfigured } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'azota-super-secret-jwt-key-gdpt2018';
const TOKEN_EXPIRY = '7d';

// Dedicated Super Admin Credentials (works consistently on both Localhost & Production)
export const SUPER_ADMIN_CONFIG: {
  id: string;
  phone: string;
  email: string | null;
  fullName: string;
  passwordPlain: string;
  role: string;
} = {
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
      cleanId.toLowerCase() === SUPER_ADMIN_CONFIG.email?.toLowerCase() ||
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

  async updateProfile(userId: string, data: { fullName?: string; email?: string }): Promise<SanitizedUser> {
    const cleanName = data.fullName?.trim();
    if (cleanName !== undefined && cleanName.length < 2) {
      throw new Error('Họ và tên phải có ít nhất 2 ký tự');
    }

    const cleanEmail = data.email !== undefined ? (data.email.trim() ? data.email.trim() : null) : undefined;
    if (cleanEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        throw new Error('Định dạng email không hợp lệ');
      }
    }

    // 1. Super Admin Profile update
    if (userId === SUPER_ADMIN_CONFIG.id) {
      if (cleanName) SUPER_ADMIN_CONFIG.fullName = cleanName;
      if (cleanEmail !== undefined) SUPER_ADMIN_CONFIG.email = cleanEmail;

      if (isDatabaseConfigured) {
        try {
          await prisma.user.upsert({
            where: { phone: SUPER_ADMIN_CONFIG.phone },
            update: {
              fullName: SUPER_ADMIN_CONFIG.fullName,
              email: SUPER_ADMIN_CONFIG.email,
            },
            create: {
              id: SUPER_ADMIN_CONFIG.id,
              fullName: SUPER_ADMIN_CONFIG.fullName,
              phone: SUPER_ADMIN_CONFIG.phone,
              email: SUPER_ADMIN_CONFIG.email,
              passwordHash: await this.hashPassword(SUPER_ADMIN_CONFIG.passwordPlain),
              role: 'ADMIN',
            }
          });
        } catch (e: any) {
          console.warn('Could not update admin in DB:', e.message);
        }
      }

      return {
        id: SUPER_ADMIN_CONFIG.id,
        fullName: SUPER_ADMIN_CONFIG.fullName,
        phone: SUPER_ADMIN_CONFIG.phone,
        email: SUPER_ADMIN_CONFIG.email,
        role: 'ADMIN',
        createdAt: new Date('2026-01-01T00:00:00Z'),
      };
    }

    // 2. Database update
    if (isDatabaseConfigured) {
      try {
        const updated = await prisma.user.update({
          where: { id: userId },
          data: {
            fullName: cleanName,
            email: cleanEmail,
          }
        });
        return {
          id: updated.id,
          fullName: updated.fullName,
          phone: updated.phone,
          email: updated.email,
          role: updated.role,
          createdAt: updated.createdAt,
        };
      } catch (e: any) {
        console.warn('Prisma updateProfile failed, falling back to memory store:', e.message);
      }
    }

    // 3. In-memory update
    const memUser = memoryUsers.get(userId);
    if (!memUser) {
      throw new Error('Người dùng không tồn tại');
    }
    if (cleanName) memUser.fullName = cleanName;
    if (cleanEmail !== undefined) memUser.email = cleanEmail;

    return {
      id: memUser.id,
      fullName: memUser.fullName,
      phone: memUser.phone,
      email: memUser.email,
      role: memUser.role,
      createdAt: memUser.createdAt,
    };
  }

  async changePassword(userId: string, input: { oldPassword: string; newPassword: string }): Promise<boolean> {
    if (!input.oldPassword) {
      throw new Error('Vui lòng nhập mật khẩu hiện tại');
    }
    if (!input.newPassword || input.newPassword.length < 6) {
      throw new Error('Mật khẩu mới phải có ít nhất 6 ký tự');
    }

    // 1. Super Admin Password change
    if (userId === SUPER_ADMIN_CONFIG.id) {
      if (input.oldPassword !== SUPER_ADMIN_CONFIG.passwordPlain) {
        throw new Error('Mật khẩu hiện tại không chính xác');
      }
      SUPER_ADMIN_CONFIG.passwordPlain = input.newPassword;

      if (isDatabaseConfigured) {
        try {
          const hash = await this.hashPassword(input.newPassword);
          await prisma.user.upsert({
            where: { phone: SUPER_ADMIN_CONFIG.phone },
            update: { passwordHash: hash },
            create: {
              id: SUPER_ADMIN_CONFIG.id,
              fullName: SUPER_ADMIN_CONFIG.fullName,
              phone: SUPER_ADMIN_CONFIG.phone,
              email: SUPER_ADMIN_CONFIG.email,
              passwordHash: hash,
              role: 'ADMIN',
            }
          });
        } catch (e: any) {
          console.warn('Could not update admin password in DB:', e.message);
        }
      }
      return true;
    }

    // 2. Database User Password change
    if (isDatabaseConfigured) {
      try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user) {
          const isMatch = await this.comparePassword(input.oldPassword, user.passwordHash);
          if (!isMatch) {
            throw new Error('Mật khẩu hiện tại không chính xác');
          }
          const hash = await this.hashPassword(input.newPassword);
          await prisma.user.update({
            where: { id: userId },
            data: { passwordHash: hash }
          });
          return true;
        }
      } catch (e: any) {
        if (e.message === 'Mật khẩu hiện tại không chính xác') throw e;
      }
    }

    // 3. In-memory User Password change
    const memUser = memoryUsers.get(userId);
    if (!memUser) {
      throw new Error('Người dùng không tồn tại');
    }
    const isMatch = await this.comparePassword(input.oldPassword, memUser.passwordHash);
    if (!isMatch) {
      throw new Error('Mật khẩu hiện tại không chính xác');
    }
    memUser.passwordHash = await this.hashPassword(input.newPassword);
    return true;
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

  async adminCreateUser(input: {
    fullName: string;
    phone: string;
    email?: string;
    password?: string;
    role?: string;
  }): Promise<SanitizedUser> {
    const cleanPhone = input.phone.trim();
    const cleanEmail = input.email ? input.email.trim().toLowerCase() : null;
    const cleanRole = input.role === 'ADMIN' ? 'ADMIN' : 'USER';
    const plainPassword = input.password && input.password.length >= 6 ? input.password : 'Azota123@';

    // Prevent duplicate phone/email with super admin
    if (cleanPhone === SUPER_ADMIN_CONFIG.phone || (cleanEmail && cleanEmail === SUPER_ADMIN_CONFIG.email)) {
      throw new Error('Số điện thoại hoặc Email này được bảo lưu cho Super Admin');
    }

    if (isDatabaseConfigured) {
      try {
        const existingByPhone = await prisma.user.findUnique({ where: { phone: cleanPhone } });
        if (existingByPhone) throw new Error('Số điện thoại đã tồn tại trên hệ thống');

        if (cleanEmail) {
          const existingByEmail = await prisma.user.findUnique({ where: { email: cleanEmail } });
          if (existingByEmail) throw new Error('Email đã tồn tại trên hệ thống');
        }

        const passwordHash = await this.hashPassword(plainPassword);
        const user = await prisma.user.create({
          data: {
            fullName: input.fullName.trim(),
            phone: cleanPhone,
            email: cleanEmail,
            passwordHash,
            role: cleanRole,
          }
        });

        return {
          id: user.id,
          fullName: user.fullName,
          phone: user.phone,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        };
      } catch (e: any) {
        if (e.message.includes('tồn tại') || e.message.includes('bảo lưu')) throw e;
      }
    }

    // Fallback in-memory
    for (const u of memoryUsers.values()) {
      if (u.phone === cleanPhone) throw new Error('Số điện thoại đã tồn tại trên hệ thống');
      if (cleanEmail && u.email === cleanEmail) throw new Error('Email đã tồn tại trên hệ thống');
    }

    const passwordHash = await this.hashPassword(plainPassword);
    const newId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const userRecord = {
      id: newId,
      fullName: input.fullName.trim(),
      phone: cleanPhone,
      email: cleanEmail,
      passwordHash,
      role: cleanRole,
      createdAt: new Date(),
    };
    memoryUsers.set(newId, userRecord);

    return {
      id: userRecord.id,
      fullName: userRecord.fullName,
      phone: userRecord.phone,
      email: userRecord.email,
      role: userRecord.role,
      createdAt: userRecord.createdAt,
    };
  }

  async adminResetPassword(userId: string, newPassword: string): Promise<boolean> {
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Mật khẩu mới phải có tối thiểu 6 ký tự');
    }

    if (userId === SUPER_ADMIN_CONFIG.id) {
      SUPER_ADMIN_CONFIG.passwordPlain = newPassword;
      if (isDatabaseConfigured) {
        try {
          const hash = await this.hashPassword(newPassword);
          await prisma.user.update({
            where: { phone: SUPER_ADMIN_CONFIG.phone },
            data: { passwordHash: hash }
          });
        } catch {}
      }
      return true;
    }

    if (isDatabaseConfigured) {
      try {
        const hash = await this.hashPassword(newPassword);
        await prisma.user.update({
          where: { id: userId },
          data: { passwordHash: hash }
        });
        return true;
      } catch {}
    }

    const memUser = memoryUsers.get(userId);
    if (!memUser) throw new Error('Người dùng không tồn tại');
    memUser.passwordHash = await this.hashPassword(newPassword);
    return true;
  }

  async adminUpdateUser(userId: string, data: {
    fullName?: string;
    phone?: string;
    email?: string;
    role?: string;
  }): Promise<SanitizedUser> {
    const cleanName = data.fullName?.trim();
    const cleanPhone = data.phone?.trim();
    const cleanEmail = data.email !== undefined ? (data.email.trim() ? data.email.trim().toLowerCase() : null) : undefined;
    const cleanRole = data.role === 'ADMIN' ? 'ADMIN' : 'USER';

    if (userId === SUPER_ADMIN_CONFIG.id) {
      if (cleanName) SUPER_ADMIN_CONFIG.fullName = cleanName;
      if (cleanEmail !== undefined) SUPER_ADMIN_CONFIG.email = cleanEmail;
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
        const updated = await prisma.user.update({
          where: { id: userId },
          data: {
            fullName: cleanName,
            phone: cleanPhone,
            email: cleanEmail,
            role: cleanRole,
          }
        });
        return {
          id: updated.id,
          fullName: updated.fullName,
          phone: updated.phone,
          email: updated.email,
          role: updated.role,
          createdAt: updated.createdAt,
        };
      } catch {}
    }

    const memUser = memoryUsers.get(userId);
    if (!memUser) throw new Error('Người dùng không tồn tại');
    if (cleanName) memUser.fullName = cleanName;
    if (cleanPhone) memUser.phone = cleanPhone;
    if (cleanEmail !== undefined) memUser.email = cleanEmail;
    if (data.role) memUser.role = cleanRole;

    return {
      id: memUser.id,
      fullName: memUser.fullName,
      phone: memUser.phone,
      email: memUser.email,
      role: memUser.role,
      createdAt: memUser.createdAt,
    };
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
