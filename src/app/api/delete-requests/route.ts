import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJwt } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET all pending delete requests (For Admin dashboard)
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const decoded = verifyJwt(token || '');

    if (!decoded || !decoded.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden. Admin access required.' },
        { status: 403 }
      );
    }

    const requests = await prisma.deleteRequest.findMany({
      where: {
        status: 'PENDING',
      },
      include: {
        payment: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      requests,
      pendingCount: requests.length,
    });
  } catch (error) {
    console.error('Error fetching delete requests:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch delete requests' },
      { status: 500 }
    );
  }
}

// POST: User submits a delete request for a payment
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { paymentId, requestedBy, reason } = body;

    if (!paymentId || !requestedBy) {
      return NextResponse.json(
        { success: false, error: 'Payment ID and user name are required.' },
        { status: 400 }
      );
    }

    // Check if payment exists
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'Payment record not found.' },
        { status: 404 }
      );
    }

    // Check if there is already a pending request for this payment
    const existing = await prisma.deleteRequest.findFirst({
      where: {
        paymentId,
        status: 'PENDING',
      },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'A deletion request is already pending for this row.',
        request: existing,
      });
    }

    const newRequest = await prisma.deleteRequest.create({
      data: {
        paymentId,
        requestedBy,
        reason: reason || 'User requested row deletion',
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Deletion request sent to Admin for approval.',
      request: newRequest,
    });
  } catch (error) {
    console.error('Error submitting delete request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit delete request' },
      { status: 500 }
    );
  }
}

// PATCH: Admin Accepts or Rejects a delete request
export async function PATCH(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const decoded = verifyJwt(token || '');

    if (!decoded || !decoded.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden. Admin access required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { requestId, action } = body; // action: 'ACCEPT' | 'REJECT'

    if (!requestId || !action) {
      return NextResponse.json(
        { success: false, error: 'Request ID and action are required.' },
        { status: 400 }
      );
    }

    const reqRecord = await prisma.deleteRequest.findUnique({
      where: { id: requestId },
      include: { payment: true },
    });

    if (!reqRecord) {
      return NextResponse.json(
        { success: false, error: 'Delete request not found.' },
        { status: 404 }
      );
    }

    if (action === 'ACCEPT') {
      // Delete the payment (Cascade will remove the delete request)
      await prisma.payment.delete({
        where: { id: reqRecord.paymentId },
      });

      return NextResponse.json({
        success: true,
        message: 'Delete request approved and payment row deleted from database.',
      });
    } else if (action === 'REJECT') {
      // Delete or update the delete request to REJECTED so payment stays safe
      await prisma.deleteRequest.delete({
        where: { id: requestId },
      });

      return NextResponse.json({
        success: true,
        message: 'Delete request rejected. Payment row preserved.',
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action.' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error processing delete request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process delete request' },
      { status: 500 }
    );
  }
}
