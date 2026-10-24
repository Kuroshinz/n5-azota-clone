import { describe, it, expect, beforeEach } from 'vitest';
import { AuthService } from '../src/server/authService';
import { prisma } from '../src/server/prisma';

describe('AuthService', () => {
  const auth = new AuthService();
  const testPhone = '0988776655';
  const testEmail = 'tester@azota.vn';
  const testPassword = 'Password123!';

  beforeEach(async () => {
    // Clean up test user if exists
    await prisma.user.deleteMany({
      where: {
        OR: [{ phone: testPhone }, { email: testEmail }]
      }
    });
  });

  it('hashes and verifies passwords correctly', async () => {
    const hash = await auth.hashPassword('Secret123');
    expect(hash).not.toBe('Secret123');
    const isValid = await auth.comparePassword('Secret123', hash);
    expect(isValid).toBe(true);
    const isInvalid = await auth.comparePassword('WrongPassword', hash);
    expect(isInvalid).toBe(false);
  });

  it('signs and verifies JWT tokens', () => {
    const payload = { userId: 'user-123', role: 'USER', fullName: 'Nguyễn Văn Test' };
    const token = auth.createToken(payload);
    expect(typeof token).toBe('string');
    const decoded = auth.verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe('user-123');
    expect(decoded?.fullName).toBe('Nguyễn Văn Test');
  });

  it('registers a new user and rejects duplicate phone', async () => {
    const user = await auth.registerUser({
      fullName: 'Nguyễn Văn Test',
      phone: testPhone,
      email: testEmail,
      password: testPassword
    });

    expect(user.id).toBeDefined();
    expect(user.phone).toBe(testPhone);
    expect(user.fullName).toBe('Nguyễn Văn Test');
    expect((user as any).passwordHash).toBeUndefined(); // ensure passwordHash is omitted

    // Duplicate registration should fail
    await expect(
      auth.registerUser({
        fullName: 'Người khác',
        phone: testPhone,
        password: 'Password456'
      })
    ).rejects.toThrow('Số điện thoại đã được đăng ký');
  });

  it('logs in with phone or email and returns token', async () => {
    await auth.registerUser({
      fullName: 'Trần Thị Học Sinh',
      phone: testPhone,
      email: testEmail,
      password: testPassword
    });

    // Login with phone
    const loginByPhone = await auth.loginUser(testPhone, testPassword);
    expect(loginByPhone.token).toBeDefined();
    expect(loginByPhone.user.fullName).toBe('Trần Thị Học Sinh');

    // Login with email
    const loginByEmail = await auth.loginUser(testEmail, testPassword);
    expect(loginByEmail.token).toBeDefined();
    expect(loginByEmail.user.phone).toBe(testPhone);

    // Login with wrong password
    await expect(auth.loginUser(testPhone, 'WrongPassword')).rejects.toThrow('Mật khẩu không chính xác');

    // Login with non-existent phone
    await expect(auth.loginUser('0999999999', 'AnyPassword')).rejects.toThrow('Tài khoản không tồn tại');
  });
});
