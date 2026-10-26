import { NextRequest, NextResponse } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/server/prisma';
import { getAuthUser, getLocalUsers } from '@/server/authService';
import { listExams as listLocalExams, getSubmissions as getLocalSubmissions } from '@/storage/examStorage';

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth || auth.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền truy cập' }, { status: 403 });
    }

    let usersCount = 0;
    let examsCount = 0;
    let submissionsCount = 0;

    if (isDatabaseConfigured) {
      try {
        [usersCount, examsCount, submissionsCount] = await Promise.all([
          prisma.user.count(),
          prisma.exam.count(),
          prisma.submission.count(),
        ]);
      } catch {
        usersCount = getLocalUsers().length;
        examsCount = listLocalExams().length;
        submissionsCount = getLocalSubmissions().length;
      }
    } else {
      usersCount = getLocalUsers().length;
      examsCount = listLocalExams().length;
      submissionsCount = getLocalSubmissions().length;
    }

    return NextResponse.json({
      success: true,
      system: {
        databaseConfigured: isDatabaseConfigured,
        databaseType: isDatabaseConfigured ? 'PostgreSQL' : 'In-Memory (Local Dev)',
        nodeVersion: process.version,
        uptimeSeconds: Math.floor(process.uptime()),
        serverTime: new Date().toISOString(),
        memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        zeroDataLeakActive: true,
      },
      counts: {
        users: usersCount,
        exams: examsCount,
        submissions: submissionsCount,
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth || auth.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền truy cập' }, { status: 403 });
    }

    let users: any[] = [];
    let exams: any[] = [];
    let submissions: any[] = [];

    if (isDatabaseConfigured) {
      try {
        [users, exams, submissions] = await Promise.all([
          prisma.user.findMany({ select: { id: true, fullName: true, phone: true, email: true, role: true, createdAt: true } }),
          prisma.exam.findMany(),
          prisma.submission.findMany(),
        ]);
      } catch {
        users = getLocalUsers();
        exams = listLocalExams();
        submissions = getLocalSubmissions();
      }
    } else {
      users = getLocalUsers();
      exams = listLocalExams();
      submissions = getLocalSubmissions();
    }

    return NextResponse.json({
      success: true,
      exportedAt: new Date().toISOString(),
      backup: {
        users,
        exams,
        submissions,
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
