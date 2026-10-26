import { NextRequest, NextResponse } from 'next/server';
import { authService, getAuthUser } from '@/server/authService';

export async function POST(req: NextRequest) {
  try {
    const payload = getAuthUser(req);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng đăng nhập để thực hiện thao tác này' },
        { status: 401 }
      );
    }

    const body = await req.json();
    if (!body.oldPassword) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng nhập mật khẩu hiện tại' },
        { status: 400 }
      );
    }
    if (!body.newPassword || body.newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Mật khẩu mới phải có tối thiểu 6 ký tự' },
        { status: 400 }
      );
    }

    await authService.changePassword(payload.userId, {
      oldPassword: body.oldPassword,
      newPassword: body.newPassword,
    });

    return NextResponse.json({
      success: true,
      message: 'Đổi mật khẩu thành công. Vui lòng ghi nhớ mật khẩu mới của bạn.'
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Đổi mật khẩu thất bại' },
      { status: 400 }
    );
  }
}
