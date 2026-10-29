import { NextRequest, NextResponse } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/server/prisma';
import { getAuthUser, getLocalUsers, updateLocalUserRole, deleteLocalUser } from '@/server/authService';

/**
 * GET /api/admin/users
 * Returns list of users with search, role filter, and pagination
 */
export async function GET(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth || auth.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Bạn không có quyền truy cập' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const query = (searchParams.get('q') || '').toLowerCase().trim();
    const role = searchParams.get('role');

    if (!isDatabaseConfigured) {
      let localUsers = getLocalUsers();
      if (role) {
        localUsers = localUsers.filter(u => u.role === role);
      }
      if (query) {
        localUsers = localUsers.filter(u =>
          (u.fullName && u.fullName.toLowerCase().includes(query)) ||
          (u.phone && u.phone.includes(query)) ||
          (u.email && u.email.toLowerCase().includes(query))
        );
      }
      return NextResponse.json({ success: true, users: localUsers });
    }

    try {
      const users = await prisma.user.findMany({
        where: {
          AND: [
            role ? { role } : {},
            query ? {
              OR: [
                { fullName: { contains: query } },
                { phone: { contains: query } },
                { email: { contains: query } }
              ]
            } : {}
          ]
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fullName: true,
          phone: true,
          email: true,
          role: true,
          createdAt: true,
          _count: {
            select: {
              exams: true,
              submissions: true,
            }
          }
        }
      });

      return NextResponse.json({ success: true, users });
    } catch (dbErr: any) {
      console.warn('Prisma DB query failed in /api/admin/users, falling back to local users:', dbErr.message);
      let localUsers = getLocalUsers();
      if (role) {
        localUsers = localUsers.filter(u => u.role === role);
      }
      if (query) {
        localUsers = localUsers.filter(u =>
          (u.fullName && u.fullName.toLowerCase().includes(query)) ||
          (u.phone && u.phone.includes(query)) ||
          (u.email && u.email.toLowerCase().includes(query))
        );
      }
      return NextResponse.json({ success: true, users: localUsers });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/users
 * Updates a user's role (e.g. USER <-> ADMIN)
 */
export async function PATCH(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth || auth.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Bạn không có quyền thực hiện' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { userId, newRole } = body;

    if (!userId || !['USER', 'ADMIN'].includes(newRole)) {
      return NextResponse.json(
        { success: false, error: 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    if (userId === auth.userId && newRole !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Không thể tự hạ quyền của chính bạn' },
        { status: 400 }
      );
    }

    if (!isDatabaseConfigured) {
      const updated = updateLocalUserRole(userId, newRole);
      return NextResponse.json({ success: true, user: updated || { id: userId, role: newRole } });
    }

    try {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { role: newRole },
        select: { id: true, fullName: true, phone: true, email: true, role: true }
      });

      return NextResponse.json({ success: true, user: updated });
    } catch {
      const updated = updateLocalUserRole(userId, newRole);
      return NextResponse.json({ success: true, user: updated || { id: userId, role: newRole } });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/users
 * Deletes a user account
 */
export async function DELETE(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth || auth.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Bạn không có quyền thực hiện' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Thiếu userId' },
        { status: 400 }
      );
    }

    if (userId === auth.userId || userId === 'admin-master-root') {
      return NextResponse.json(
        { success: false, error: 'Không thể xóa tài khoản Admin Master' },
        { status: 400 }
      );
    }

    if (!isDatabaseConfigured) {
      deleteLocalUser(userId);
      return NextResponse.json({ success: true, message: 'Đã xóa người dùng thành công' });
    }

    try {
      await prisma.user.delete({
        where: { id: userId }
      });
      return NextResponse.json({ success: true, message: 'Đã xóa người dùng thành công' });
    } catch {
      deleteLocalUser(userId);
      return NextResponse.json({ success: true, message: 'Đã xóa người dùng thành công' });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/users
 * Admin creates a new user directly
 */
export async function POST(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth || auth.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền thực hiện' }, { status: 403 });
    }

    const body = await req.json();
    if (body.action === 'bulk_delete') {
      const { userIds } = body;
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return NextResponse.json({ success: false, error: 'Thiếu danh sách userIds' }, { status: 400 });
      }
      let count = 0;
      for (const uid of userIds) {
        if (uid !== auth.userId && uid !== 'admin-master-root') {
          try {
            if (isDatabaseConfigured) {
              await prisma.user.delete({ where: { id: uid } }).catch(() => deleteLocalUser(uid));
            } else {
              deleteLocalUser(uid);
            }
            count++;
          } catch {}
        }
      }
      return NextResponse.json({ success: true, message: `Đã xóa thành công ${count} người dùng` });
    }

    if (body.action === 'bulk_role') {
      const { userIds, newRole } = body;
      if (!Array.isArray(userIds) || !['USER', 'ADMIN', 'TEACHER'].includes(newRole)) {
        return NextResponse.json({ success: false, error: 'Dữ liệu không hợp lệ' }, { status: 400 });
      }
      let count = 0;
      for (const uid of userIds) {
        if (uid !== auth.userId || newRole === 'ADMIN') {
          try {
            if (isDatabaseConfigured) {
              await prisma.user.update({ where: { id: uid }, data: { role: newRole } }).catch(() => updateLocalUserRole(uid, newRole));
            } else {
              updateLocalUserRole(uid, newRole);
            }
            count++;
          } catch {}
        }
      }
      return NextResponse.json({ success: true, message: `Đã cập nhật vai trò cho ${count} người dùng` });
    }

    const { fullName, phone, email, password, role } = body;

    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      return NextResponse.json({ success: false, error: 'Họ và tên tối thiểu 2 ký tự' }, { status: 400 });
    }
    if (!phone || typeof phone !== 'string' || phone.trim().length < 9) {
      return NextResponse.json({ success: false, error: 'Số điện thoại không hợp lệ' }, { status: 400 });
    }

    const { authService } = await import('@/server/authService');
    const newUser = await authService.adminCreateUser({
      fullName,
      phone,
      email,
      password,
      role: role || 'USER',
    });

    return NextResponse.json({ success: true, user: newUser });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Tạo người dùng thất bại' }, { status: 400 });
  }
}

/**
 * PUT /api/admin/users
 * Admin updates a user or resets their password
 */
export async function PUT(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth || auth.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền thực hiện' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, newPassword, fullName, email, phone, role } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Thiếu userId' }, { status: 400 });
    }

    const { authService } = await import('@/server/authService');

    // 1. Reset password if provided
    if (newPassword) {
      if (typeof newPassword !== 'string' || newPassword.length < 6) {
        return NextResponse.json({ success: false, error: 'Mật khẩu mới tối thiểu 6 ký tự' }, { status: 400 });
      }
      await authService.adminResetPassword(userId, newPassword);
    }

    // 2. Update user info if provided
    let updatedUser = null;
    if (fullName || email !== undefined || phone || role) {
      updatedUser = await authService.adminUpdateUser(userId, { fullName, email, phone, role });
    }

    return NextResponse.json({
      success: true,
      message: 'Cập nhật tài khoản thành công',
      user: updatedUser,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Cập nhật thất bại' }, { status: 400 });
  }
}
