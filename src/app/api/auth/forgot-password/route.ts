import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/server/authService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, identifier, otp, newPassword } = body;

    // 1. Request OTP Code
    if (action === 'request_otp') {
      if (!identifier || typeof identifier !== 'string') {
        return NextResponse.json(
          { success: false, error: 'Vui lòng cung cấp số điện thoại hoặc email đã đăng ký' },
          { status: 400 }
        );
      }

      const result = await authService.requestPasswordReset(identifier);
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error || 'Tài khoản không tồn tại' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Mã xác thực khôi phục tài khoản đã được tạo thành công',
        otp: result.otp, // Returned for smooth zero-telecom local and web testing
        expiresAt: result.expiresAt,
      });
    }

    // 2. Reset Password with verified OTP
    if (action === 'reset_password') {
      if (!identifier || !otp || !newPassword) {
        return NextResponse.json(
          { success: false, error: 'Vui lòng điền đầy đủ thông tin: tài khoản, mã OTP và mật khẩu mới' },
          { status: 400 }
        );
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { success: false, error: 'Mật khẩu mới phải có tối thiểu 6 ký tự' },
          { status: 400 }
        );
      }

      const result = await authService.resetPasswordWithOtp(identifier, otp, newPassword);
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error || 'Đặt lại mật khẩu thất bại' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay với mật khẩu mới.',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Hành động không hợp lệ (hỗ trợ request_otp hoặc reset_password)' },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Lỗi xử lý yêu cầu' },
      { status: 500 }
    );
  }
}
