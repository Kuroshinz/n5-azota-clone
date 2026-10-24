import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'azota-super-secret-jwt-key-gdpt2018';
const TOKEN_EXPIRY = '7d';

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

    // Check if phone exists
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
  }

  async loginUser(identifier: string, password: string): Promise<{ user: SanitizedUser; token: string }> {
    const cleanId = identifier.trim();

    // Find by phone or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: cleanId },
          { email: cleanId.toLowerCase() }
        ]
      }
    });

    if (!user) {
      throw new Error('Tài khoản không tồn tại');
    }

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

  async getUserById(id: string): Promise<SanitizedUser | null> {
    const user = await prisma.user.findUnique({
      where: { id }
    });
    if (!user) return null;

    return {
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
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
