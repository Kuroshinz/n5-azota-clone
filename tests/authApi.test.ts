import { describe, it, expect, beforeEach } from 'vitest';
import { POST as registerHandler } from '../src/app/api/auth/register/route';
import { POST as loginHandler } from '../src/app/api/auth/login/route';
import { GET as meHandler } from '../src/app/api/auth/me/route';
import { POST as logoutHandler } from '../src/app/api/auth/logout/route';
import { prisma } from '../src/server/prisma';
import { NextRequest } from 'next/server';

describe('Auth API Routes', () => {
  const testPhone = '0912345678';
  const testEmail = 'api_user@azota.vn';
  const testPassword = 'Password123!';

  beforeEach(async () => {
    await prisma.user.deleteMany({
      where: {
        OR: [{ phone: testPhone }, { email: testEmail }]
      }
    });
  });

  it('registers user via API and returns user data + set-cookie', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Nguyễn Văn API',
        phone: testPhone,
        email: testEmail,
        password: testPassword
      })
    });

    const res = await registerHandler(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.user.phone).toBe(testPhone);
    expect(res.cookies.get('azota_token')?.value).toBeDefined();
  });

  it('logs in user via API and validates credentials', async () => {
    // First register
    await registerHandler(new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Nguyễn Văn API',
        phone: testPhone,
        email: testEmail,
        password: testPassword
      })
    }));

    // Successful login
    const loginReq = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testPhone,
        password: testPassword
      })
    });
    const loginRes = await loginHandler(loginReq);
    expect(loginRes.status).toBe(200);
    const loginData = await loginRes.json();
    expect(loginData.success).toBe(true);
    const token = loginRes.cookies.get('azota_token')?.value;
    expect(token).toBeDefined();

    // Verify /api/auth/me with cookie
    const meReq = new NextRequest('http://localhost:3000/api/auth/me', {
      headers: {
        cookie: `azota_token=${token}`
      }
    });
    const meRes = await meHandler(meReq);
    expect(meRes.status).toBe(200);
    const meData = await meRes.json();
    expect(meData.user?.fullName).toBe('Nguyễn Văn API');

    // Logout
    const logoutRes = await logoutHandler();
    expect(logoutRes.status).toBe(200);
    expect(logoutRes.cookies.get('azota_token')?.value).toBe('');
  });
});
