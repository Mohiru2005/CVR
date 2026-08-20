import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJwt } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function getIsAdminFromRequest(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  const token = authHeader.split(' ')[1];
  const decoded = verifyJwt(token);
  return Boolean(decoded && decoded.isAdmin);
}

// GET all registered users (ADMIN ONLY)
export async function GET(request: Request) {
  try {
    const isAdmin = getIsAdminFromRequest(request);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Administrator privileges required.' },
        { status: 403 }
      );
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        isAdmin: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// DELETE a user by ID or name (ADMIN ONLY)
export async function DELETE(request: Request) {
  try {
    const isAdmin = getIsAdminFromRequest(request);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Administrator privileges required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const id = searchParams.get('id');

    if (!name && !id) {
      return NextResponse.json(
        { success: false, error: 'User identifier required' },
        { status: 400 }
      );
    }

    if (name?.toLowerCase() === 'admin') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete master admin' },
        { status: 400 }
      );
    }

    if (id) {
      await prisma.user.delete({
        where: { id },
      });
    } else if (name) {
      await prisma.user.delete({
        where: { name },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'User removed successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
