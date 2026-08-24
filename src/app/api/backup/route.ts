import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { runAutoBackupSync, getBackupFilesList } from '@/lib/backupEngine';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const BACKUP_DIR = path.join(process.cwd(), 'backups');

// GET: List all backup files or download a specific backup file
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const downloadFile = searchParams.get('download');

    // If download requested
    if (downloadFile) {
      const sanitized = path.basename(downloadFile);
      const filePath = path.join(BACKUP_DIR, sanitized);

      if (!fs.existsSync(filePath)) {
        return NextResponse.json(
          { success: false, error: 'Backup file not found on device' },
          { status: 404 }
        );
      }

      const fileBuffer = fs.readFileSync(filePath);
      const isExcel = sanitized.endsWith('.xlsx');
      const contentType = isExcel
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/json';

      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${sanitized}"`,
        },
      });
    }

    // Auto run backup sync so backups folder is always up-to-date on app open
    const backups = await runAutoBackupSync();

    return NextResponse.json({
      success: true,
      backupFolder: BACKUP_DIR,
      backups,
      totalBackups: backups.length,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in backup API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve backups' },
      { status: 500 }
    );
  }
}

// POST: Trigger an instant fresh backup
export async function POST() {
  try {
    const backups = await runAutoBackupSync();
    return NextResponse.json({
      success: true,
      message: 'Fresh backup created and saved to device folder.',
      backupFolder: BACKUP_DIR,
      backups,
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create backup' },
      { status: 500 }
    );
  }
}

// PUT: Restore database from a backup file
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { fileName } = body;

    if (!fileName) {
      return NextResponse.json(
        { success: false, error: 'Backup file name is required for recovery.' },
        { status: 400 }
      );
    }

    const sanitized = path.basename(fileName);
    const filePath = path.join(BACKUP_DIR, sanitized);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { success: false, error: 'Backup file does not exist on device.' },
        { status: 404 }
      );
    }

    let restoredCount = 0;

    if (sanitized.endsWith('.json')) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      const paymentsToRestore = data.payments || [];

      for (const p of paymentsToRestore) {
        // Upsert by ID or create if not exists
        await prisma.payment.upsert({
          where: { id: p.id },
          update: {
            date: p.date,
            senderName: p.senderName,
            amount: p.amount,
            targetBank: p.targetBank,
            remarks: p.remarks || null,
            notes: p.notes || null,
            createdByName: p.createdByName,
          },
          create: {
            id: p.id,
            date: p.date,
            senderName: p.senderName,
            amount: p.amount,
            targetBank: p.targetBank,
            remarks: p.remarks || null,
            notes: p.notes || null,
            createdByName: p.createdByName,
          },
        });
        restoredCount++;
      }
    } else if (sanitized.endsWith('.xlsx')) {
      // Import xlsx and restore rows
      const XLSX = require('xlsx');
      const wb = XLSX.readFile(filePath);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(ws);

      for (const r of rows) {
        if (r['S.No'] === 'TOTAL') continue;
        const rawDate = String(r['Date'] || '');
        let formattedDate = rawDate;
        // If DD/MM/YYYY, convert to YYYY-MM-DD for DB
        const parts = rawDate.split('/');
        if (parts.length === 3) {
          formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }

        const sender = String(r['Sender / User Name'] || 'Recovered User');
        const amount = parseFloat(r['Amount (INR)']) || 0;
        const bank = String(r['Bank to be Delivered'] || 'State Bank of India (SBI)');
        const remarks = String(r['Remarks'] || '');
        const recordedBy = String(r['Recorded By'] || 'System Recovery');

        if (amount > 0) {
          // Check if identical payment already exists
          const existing = await prisma.payment.findFirst({
            where: {
              date: formattedDate,
              senderName: sender,
              amount,
              targetBank: bank,
            },
          });

          if (!existing) {
            await prisma.payment.create({
              data: {
                date: formattedDate,
                senderName: sender,
                amount,
                targetBank: bank,
                remarks: remarks ? remarks.trim() : null,
                createdByName: recordedBy,
              },
            });
            restoredCount++;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Data recovery successful! Restored/verified ${restoredCount} payment records.`,
      restoredCount,
    });
  } catch (error) {
    console.error('Error restoring data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to restore data from backup' },
      { status: 500 }
    );
  }
}
