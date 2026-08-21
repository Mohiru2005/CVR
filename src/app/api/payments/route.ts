import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJwt } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET all payments with multi-field filtering and active delete requests
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get('q')?.trim() || '';
    const bankFilter = searchParams.get('bank')?.trim() || '';
    const startDate = searchParams.get('startDate')?.trim() || '';
    const endDate = searchParams.get('endDate')?.trim() || '';

    const whereClause: any = {};

    // 1. Filter by Name
    if (searchQuery) {
      whereClause.senderName = {
        contains: searchQuery,
      };
    }

    // 2. Filter by Bank
    if (bankFilter && bankFilter !== 'ALL') {
      whereClause.targetBank = bankFilter;
    }

    // 3. Filter by Date Range
    if (startDate && endDate) {
      whereClause.date = {
        gte: startDate,
        lte: endDate,
      };
    } else if (startDate) {
      whereClause.date = {
        gte: startDate,
      };
    } else if (endDate) {
      whereClause.date = {
        lte: endDate,
      };
    }

    const payments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        deleteRequests: {
          where: { status: 'PENDING' },
        },
      },
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // Calculate total collection amount and today's total
    const todayStr = new Date().toISOString().split('T')[0];
    let totalAmount = 0;
    let todayAmount = 0;

    for (const p of payments) {
      totalAmount += p.amount;
      if (p.date === todayStr) {
        todayAmount += p.amount;
      }
    }

    return NextResponse.json({
      success: true,
      payments,
      stats: {
        totalAmount,
        todayAmount,
        totalCount: payments.length,
      },
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payment records' },
      { status: 500 }
    );
  }
}

// POST new payment record
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, senderName, amount, targetBank, remarks, notes, createdByName } = body;

    if (!senderName || !amount || !targetBank) {
      return NextResponse.json(
        { success: false, error: 'Sender name, amount, and target bank are required.' },
        { status: 400 }
      );
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid positive payment amount.' },
        { status: 400 }
      );
    }

    const paymentDate = date && date.trim() ? date.trim() : new Date().toISOString().split('T')[0];

    const newPayment = await prisma.payment.create({
      data: {
        date: paymentDate,
        senderName: senderName.trim(),
        amount: numAmount,
        targetBank: targetBank.trim(),
        remarks: remarks ? remarks.trim() : null,
        notes: notes ? notes.trim() : null,
        createdByName: createdByName ? createdByName.trim() : 'Staff Member',
      },
    });

    return NextResponse.json({
      success: true,
      payment: newPayment,
      message: 'Payment recorded successfully',
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save payment record' },
      { status: 500 }
    );
  }
}

// DELETE a payment record (ONLY ADMIN CAN DIRECTLY DELETE)
export async function DELETE(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const decoded = verifyJwt(token || '');

    if (!decoded || !decoded.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Only Master Admin is authorized to delete payment records.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Payment ID is required.' },
        { status: 400 }
      );
    }

    await prisma.payment.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Payment record deleted',
    });
  } catch (error) {
    console.error('Error deleting payment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete payment' },
      { status: 500 }
    );
  }
}
