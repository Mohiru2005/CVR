import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, signJwt } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, password } = body;

    if (!name || !password) {
      return NextResponse.json(
        { success: false, error: 'Name and password are required.' },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();

    // 1. Dedicated Master Admin Authentication
    if (trimmedName.toLowerCase() === 'admin' && password === 'Pavanpesala@2005') {
      const adminUser = {
        id: 'admin_master',
        name: 'Admin',
        isAdmin: true,
        lastLogin: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      const token = signJwt({
        id: adminUser.id,
        name: adminUser.name,
        isAdmin: true,
      });

      return NextResponse.json({
        success: true,
        user: adminUser,
        token,
      });
    }

    // 2. Database User Lookup
    const user = await prisma.user.findUnique({
      where: {
        name: trimmedName,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid name or password.' },
        { status: 401 }
      );
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: 'Invalid name or password.' },
        { status: 401 }
      );
    }

    const userPayload = {
      id: user.id,
      name: user.name,
      isAdmin: user.isAdmin,
      lastLogin: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const token = signJwt({
      id: user.id,
      name: user.name,
      isAdmin: user.isAdmin,
    });

    return NextResponse.json({
      success: true,
      user: userPayload,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
