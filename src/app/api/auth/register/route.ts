import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signJwt } from '@/lib/auth';

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

    if (trimmedName.toLowerCase() === 'admin') {
      return NextResponse.json(
        { success: false, error: 'Username "admin" is reserved.' },
        { status: 400 }
      );
    }

    if (password.length < 4) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 4 characters.' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        name: trimmedName,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'An account with this name already exists.' },
        { status: 409 }
      );
    }

    // Hash password and store in database
    const passwordHash = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        name: trimmedName,
        passwordHash,
        isAdmin: false,
        role: 'User',
      },
    });

    const userPayload = {
      id: newUser.id,
      name: newUser.name,
      isAdmin: newUser.isAdmin,
      lastLogin: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const token = signJwt({
      id: newUser.id,
      name: newUser.name,
      isAdmin: newUser.isAdmin,
    });

    return NextResponse.json({
      success: true,
      user: userPayload,
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create account.' },
      { status: 500 }
    );
  }
}
