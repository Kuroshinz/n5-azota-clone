import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/server/authService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, password } = body;

    if (!identifier || typeof identifier !== 'string') {
      return NextResponse.json({ success: false, error: 'Vui lòng nhập Số điện thoại hoặc Email' }, { status: 400 });
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ success: false, error: 'Vui lòng nhập mật khẩu' }, { status: 400 });
    }

    const { user, token } = await authService.loginUser(identifier, password);

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
    return NextResponse.json({ success: false, error: err.message || 'Lỗi đăng nhập' }, { status: 400 });
  }
}
