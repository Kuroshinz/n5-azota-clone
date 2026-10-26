import { NextRequest, NextResponse } from 'next/server';
import { authService, getAuthUser } from '@/server/authService';

export async function GET(req: NextRequest) {
  try {
    const payload = getAuthUser(req);
    if (!payload) {
      return NextResponse.json({ success: true, user: null });
    }

    const user = await authService.getUserById(payload.userId);
    return NextResponse.json({ success: true, user: user || null });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const payload = getAuthUser(req);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng đăng nhập để thực hiện thao tác này' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const updatedUser = await authService.updateProfile(payload.userId, {
      fullName: body.fullName,
      email: body.email,
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
