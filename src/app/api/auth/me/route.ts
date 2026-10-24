import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/server/authService';

export async function GET(req: NextRequest) {
  try {
    const tokenCookie = req.cookies.get('azota_token')?.value;
    const authHeader = req.headers.get('authorization');
    const token = tokenCookie || (authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null);

    if (!token) {
      return NextResponse.json({ success: true, user: null });
    }

    const payload = authService.verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: true, user: null });
    }

    const user = await authService.getUserById(payload.userId);
    return NextResponse.json({ success: true, user: user || null });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
