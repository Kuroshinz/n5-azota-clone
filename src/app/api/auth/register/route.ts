import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/server/authService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fullName, phone, email, password } = body;

    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      return NextResponse.json({ success: false, error: 'Họ và tên tối thiểu 2 ký tự' }, { status: 400 });
    }

    if (!phone || typeof phone !== 'string' || phone.trim().length < 9) {
      return NextResponse.json({ success: false, error: 'Số điện thoại không hợp lệ' }, { status: 400 });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ success: false, error: 'Mật khẩu tối thiểu 6 ký tự' }, { status: 400 });
    }

    const user = await authService.registerUser({ fullName, phone, email, password });
    const token = authService.createToken({
      userId: user.id,
      role: user.role,
      fullName: user.fullName
    });

    const isHttps = req.nextUrl.protocol === 'https:';
    const response = NextResponse.json({ success: true, user, token });
    response.cookies.set('azota_token', token, {
      httpOnly: false, // allow client-side cookie synchronization
      secure: isHttps,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Lỗi đăng ký' }, { status: 400 });
  }
}
