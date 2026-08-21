import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJwt } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function getIsAdminFromRequest(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  const token = authHeader.split(' ')[1];
  const decoded = verifyJwt(token);
  return Boolean(decoded && decoded.isAdmin);
}

// GET all users (ADMIN ONLY) — includes PENDING and APPROVED
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
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// PATCH: Approve or Reject a pending user registration (ADMIN ONLY)
export async function PATCH(request: Request) {
  try {
    const isAdmin = getIsAdminFromRequest(request);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Administrator privileges required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, action } = body; // action: 'APPROVE' | 'REJECT'

    if (!userId || !action) {
      return NextResponse.json(
        { success: false, error: 'userId and action are required.' },
        { status: 400 }
      );
    }

    if (action === 'APPROVE') {
      await prisma.user.update({
        where: { id: userId },
        data: { status: 'APPROVED' },
      });
      return NextResponse.json({ success: true, message: 'User approved. They can now login.' });
    }

    if (action === 'REJECT') {
      // Delete the pending registration entirely
      await prisma.user.delete({ where: { id: userId } });
      return NextResponse.json({ success: true, message: 'User registration rejected and removed.' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action.' }, { status: 400 });
  } catch (error) {
    console.error('Error processing user approval:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process approval' },
      { status: 500 }
    );
  }
}

// DELETE a user by ID (ADMIN ONLY)
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
      await prisma.user.delete({ where: { id } });
    } else if (name) {
      await prisma.user.delete({ where: { name } });
    }

    return NextResponse.json({ success: true, message: 'User removed successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
