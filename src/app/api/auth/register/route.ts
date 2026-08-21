import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

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

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { name: trimmedName },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'An account with this name already exists.' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    // Create user with PENDING status — Admin must approve before they can login
    await prisma.user.create({
      data: {
        name: trimmedName,
        passwordHash,
        isAdmin: false,
        role: 'User',
        status: 'PENDING',
      },
    });

    // Return pending status — no JWT token issued yet
    return NextResponse.json({
      success: true,
      pending: true,
      message: 'Registration request sent to Admin. Please wait for approval.',
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create account.' },
      { status: 500 }
    );
  }
}
