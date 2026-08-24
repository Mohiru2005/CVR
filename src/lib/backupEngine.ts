import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { prisma } from './prisma';

const BACKUP_DIR = path.join(process.cwd(), 'backups');

// Ensure backups directory exists
function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

// Format YYYY-MM-DD -> DD/MM/YYYY
function formatDateDisplay(dStr: string) {
  if (!dStr) return '';
  const parts = dStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dStr;
}

// Generate Excel file from payments array
function createExcelBuffer(payments: any[], title: string): Buffer {
  const rows = payments.map((p, idx) => ({
    'S.No': idx + 1,
    'Date': formatDateDisplay(p.date),
    'Sender / User Name': p.senderName || '',
    'Amount (INR)': Number(p.amount || 0),
    'Bank to be Delivered': p.targetBank || '',
    'Remarks': p.remarks || '',
    'Recorded By': p.createdByName || '',
  }));

  const totalAmt = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  rows.push({
    'S.No': 'TOTAL' as any,
    'Date': `${payments.length} Rows`,
    'Sender / User Name': 'Total Collection',
    'Amount (INR)': totalAmt,
    'Bank to be Delivered': '',
    'Remarks': '',
    'Recorded By': '',
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 8 },
    { wch: 16 },
    { wch: 26 },
    { wch: 18 },
    { wch: 32 },
    { wch: 30 },
    { wch: 22 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Payments');

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

export interface BackupFileInfo {
  fileName: string;
  filePath: string;
  type: '10-DAYS' | 'WEEKLY' | 'FULL';
  recordCount: number;
  totalAmount: number;
  createdAt: string;
  fileSizeKb: number;
}

// Run auto-backup sync to local device folder
export async function runAutoBackupSync(): Promise<BackupFileInfo[]> {
  ensureBackupDir();

  const allPayments = await prisma.payment.findMany({
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  });

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const todayFormatted = formatDateDisplay(todayStr).replace(/\//g, '_');

  // 1. Calculate 10-Days Filter
  const tenDaysAgo = new Date();
  tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
  const tenDaysAgoStr = tenDaysAgo.toISOString().split('T')[0];
  const tenDaysPayments = allPayments.filter((p) => p.date >= tenDaysAgoStr);

  // 2. Calculate Weekly Filter (Last 7 Days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
  const weeklyPayments = allPayments.filter((p) => p.date >= sevenDaysAgoStr);

  // 3. Save 10-Day Excel Snapshot to local backups/ folder
  const tenDaysFileName = `CVR_10Days_Backup_${todayFormatted}.xlsx`;
  const tenDaysPath = path.join(BACKUP_DIR, tenDaysFileName);
  fs.writeFileSync(tenDaysPath, createExcelBuffer(tenDaysPayments, '10-Day Payments'));

  // 4. Save Weekly Excel Snapshot to local backups/ folder
  const weeklyFileName = `CVR_Weekly_Backup_${todayFormatted}.xlsx`;
  const weeklyPath = path.join(BACKUP_DIR, weeklyFileName);
  fs.writeFileSync(weeklyPath, createExcelBuffer(weeklyPayments, 'Weekly Payments'));

  // 5. Save Full Complete Excel Snapshot
  const fullFileName = `CVR_Full_Database_${todayFormatted}.xlsx`;
  const fullPath = path.join(BACKUP_DIR, fullFileName);
  fs.writeFileSync(fullPath, createExcelBuffer(allPayments, 'All Payments'));

  // 6. Save JSON Data Recovery Snapshot for 100% loss recovery
  const jsonFileName = `CVR_Recovery_Snapshot_${todayFormatted}.json`;
  const jsonPath = path.join(BACKUP_DIR, jsonFileName);
  fs.writeFileSync(
    jsonPath,
    JSON.stringify(
      {
        exportedAt: now.toISOString(),
        totalPayments: allPayments.length,
        payments: allPayments,
      },
      null,
      2
    )
  );

  // 7. Prune older backups: keep maximum latest 10 files per category
  pruneBackupFiles();

  return getBackupFilesList();
}

// Prune older files in backups/
function pruneBackupFiles() {
  try {
    ensureBackupDir();
    const files = fs.readdirSync(BACKUP_DIR);
    const excelFiles = files
      .filter((f) => f.endsWith('.xlsx'))
      .map((f) => ({
        name: f,
        time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime(),
      }))
      .sort((a, b) => b.time - a.time);

    // Keep top 10 most recent Excel snapshots
    if (excelFiles.length > 10) {
      const toDelete = excelFiles.slice(10);
      for (const item of toDelete) {
        fs.unlinkSync(path.join(BACKUP_DIR, item.name));
      }
    }
  } catch (err) {
    console.error('Error pruning backups:', err);
  }
}

// Get list of all backup files currently in local device folder
export function getBackupFilesList(): BackupFileInfo[] {
  ensureBackupDir();
  const files = fs.readdirSync(BACKUP_DIR);

  const results: BackupFileInfo[] = [];

  for (const f of files) {
    if (!f.endsWith('.xlsx') && !f.endsWith('.json')) continue;
    const fullPath = path.join(BACKUP_DIR, f);
    const stats = fs.statSync(fullPath);

    let type: '10-DAYS' | 'WEEKLY' | 'FULL' = 'FULL';
    if (f.includes('10Days')) type = '10-DAYS';
    else if (f.includes('Weekly')) type = 'WEEKLY';

    let recordCount = 0;
    let totalAmount = 0;

    if (f.endsWith('.xlsx')) {
      try {
        const wb = XLSX.readFile(fullPath);
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data: any[] = XLSX.utils.sheet_to_json(ws);
        const validRows = data.filter((r) => r['S.No'] !== 'TOTAL');
        recordCount = validRows.length;
        totalAmount = validRows.reduce((sum, r) => sum + (Number(r['Amount (INR)']) || 0), 0);
      } catch (e) {
        // ignore parse error
      }
    }

    results.push({
      fileName: f,
      filePath: fullPath,
      type,
      recordCount,
      totalAmount,
      createdAt: stats.mtime.toISOString(),
      fileSizeKb: Math.round((stats.size / 1024) * 10) / 10,
    });
  }

  return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
