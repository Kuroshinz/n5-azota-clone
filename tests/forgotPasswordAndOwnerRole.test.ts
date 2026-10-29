import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { authService, SUPER_ADMIN_CONFIG } from '../src/server/authService';
import { POST as forgotPasswordHandler } from '../src/app/api/auth/forgot-password/route';
import { POST as systemHandler } from '../src/app/api/admin/system/route';
import { PATCH as userRolePatchHandler, POST as userPostHandler } from '../src/app/api/admin/users/route';

describe('Forgot Password Flow & OWNER Sovereign Role Enforcement', () => {
  const studentPhone = '0912345678';
  const normalAdminPhone = '0922334455';

  beforeEach(async () => {
    // 1. Create a regular student
    try {
      await authService.registerUser({
        fullName: 'Học Sinh Quên Mật Khẩu',
        phone: studentPhone,
        password: 'initialPassword123',
      });
    } catch {}

    // 2. Create a regular ADMIN
    try {
      await authService.adminCreateUser({
        fullName: 'Quản Trị Viên Phụ',
        phone: normalAdminPhone,
        password: 'adminSubPassword123',
        role: 'ADMIN',
      });
    } catch {}
  });

  describe('Part 1: Forgot Password & Account Recovery', () => {
    it('should reject OTP request for non-existent account', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request_otp', identifier: '0900000000' }),
      });
      const res = await forgotPasswordHandler(req);
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Không tìm thấy tài khoản');
    });

    it('should generate 6-digit OTP and successfully reset password for student', async () => {
      // Step 1: Request OTP
      const req1 = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request_otp', identifier: studentPhone }),
      });
      const res1 = await forgotPasswordHandler(req1);
      expect(res1.status).toBe(200);
      const data1 = await res1.json();
      expect(data1.success).toBe(true);
      expect(data1.otp).toBeDefined();
      expect(data1.otp.length).toBe(6);

      const receivedOtp = data1.otp;

      // Step 2: Try reset with wrong OTP
      const reqFail = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset_password',
          identifier: studentPhone,
          otp: '000000',
          newPassword: 'myBrandNewPassword2026',
        }),
      });
      const resFail = await forgotPasswordHandler(reqFail);
      expect(resFail.status).toBe(400);

      // Step 3: Reset with correct OTP
      const req2 = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset_password',
          identifier: studentPhone,
          otp: receivedOtp,
          newPassword: 'myBrandNewPassword2026',
        }),
      });
      const res2 = await forgotPasswordHandler(req2);
      expect(res2.status).toBe(200);
      const data2 = await res2.json();
      expect(data2.success).toBe(true);

      // Step 4: Verify student can log in with new password
      const loginSuccess = await authService.loginUser(studentPhone, 'myBrandNewPassword2026');
      expect(loginSuccess.token).toBeDefined();
      expect(loginSuccess.user.phone).toBe(studentPhone);
    });
  });

  describe('Part 2: OWNER Sovereign Authority Protection', () => {
    it('should forbid normal ADMIN from executing system restore, while allowing OWNER', async () => {
      const normalAdminToken = authService.createToken({
        userId: 'normal-admin-id',
        role: 'ADMIN',
        fullName: 'Admin Phụ',
      });

      const ownerToken = authService.createToken({
        userId: SUPER_ADMIN_CONFIG.id,
        role: 'OWNER',
        fullName: SUPER_ADMIN_CONFIG.fullName,
      });

      // 1. Normal Admin tries to call system restore -> 403 Forbidden
      const reqDenied = new NextRequest('http://localhost:3000/api/admin/system', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${normalAdminToken}`,
        },
        body: JSON.stringify({ action: 'restore', exams: [] }),
      });
      const resDenied = await systemHandler(reqDenied);
      expect(resDenied.status).toBe(403);
      const dataDenied = await resDenied.json();
      expect(dataDenied.error).toContain('Chủ sở hữu (OWNER)');

      // 2. OWNER calls system restore -> 200 OK
      const reqAllowed = new NextRequest('http://localhost:3000/api/admin/system', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({ action: 'restore', exams: [] }),
      });
      const resAllowed = await systemHandler(reqAllowed);
      expect(resAllowed.status).toBe(200);
    });

    it('should forbid normal ADMIN from delegating or altering ADMIN role, while allowing OWNER', async () => {
      const normalAdminToken = authService.createToken({
        userId: 'normal-admin-id',
        role: 'ADMIN',
        fullName: 'Admin Phụ',
      });

      const ownerToken = authService.createToken({
        userId: SUPER_ADMIN_CONFIG.id,
        role: 'OWNER',
        fullName: SUPER_ADMIN_CONFIG.fullName,
      });

      // Normal Admin tries to promote student to ADMIN -> 403 Forbidden
      const reqPromoteDenied = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${normalAdminToken}`,
        },
        body: JSON.stringify({ userId: 'student-id-1', newRole: 'ADMIN' }),
      });
      const resPromoteDenied = await userRolePatchHandler(reqPromoteDenied);
      expect(resPromoteDenied.status).toBe(403);
      const dataPromote = await resPromoteDenied.json();
      expect(dataPromote.error).toContain('Chủ sở hữu (OWNER)');

      // Normal Admin tries to modify OWNER -> 403 Forbidden
      const reqTouchOwner = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${normalAdminToken}`,
        },
        body: JSON.stringify({ userId: SUPER_ADMIN_CONFIG.id, newRole: 'USER' }),
      });
      const resTouchOwner = await userRolePatchHandler(reqTouchOwner);
      expect(resTouchOwner.status).toBe(403);

      // OWNER can execute emergency password override for any user
      const reqEmergency = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({
          action: 'owner_reset_password',
          targetUserId: SUPER_ADMIN_CONFIG.id,
          newPassword: 'newOwnerPassword123@',
        }),
      });
      const resEmergency = await userPostHandler(reqEmergency);
      expect(resEmergency.status).toBe(200);
      const dataEmergency = await resEmergency.json();
      expect(dataEmergency.success).toBe(true);
    });
  });
});
