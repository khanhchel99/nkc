import { NextRequest } from 'next/server';
import ExcelJS from 'exceljs';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { apiHandler, json, ApiError } from '@/lib/api-helpers';

interface ParsedLine {
  rowNumber: number;
  productCode: string;
  quantity: number;
  unitPrice?: number;
  requestedETD?: string;
  priority?: string;
  note?: string;
}

interface ParseError {
  rowNumber: number;
  field: string;
  message: string;
}

function parseExcel(workbook: ExcelJS.Workbook) {
  const lines: ParsedLine[] = [];
  const errors: ParseError[] = [];

  const sheet = workbook.getWorksheet('OrderLines');
  if (!sheet) {
    errors.push({ rowNumber: 0, field: 'sheet', message: 'OrderLines sheet not found' });
    return { lines, errors };
  }

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const productCode = row.getCell(1).value?.toString().trim() || '';
    const quantityRaw = row.getCell(2).value;
    const unitPriceRaw = row.getCell(3).value;
    const requestedETD = row.getCell(4).value?.toString().trim() || undefined;
    const priority = row.getCell(5).value?.toString().trim() || 'normal';
    const note = row.getCell(6).value?.toString().trim() || undefined;

    if (!productCode) {
      errors.push({ rowNumber, field: 'productCode', message: 'Product code is required' });
      return;
    }

    const quantity = typeof quantityRaw === 'number' ? quantityRaw : parseInt(String(quantityRaw), 10);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      errors.push({ rowNumber, field: 'quantity', message: 'Quantity must be a positive integer' });
      return;
    }

    const unitPrice = typeof unitPriceRaw === 'number' ? unitPriceRaw : unitPriceRaw ? parseFloat(String(unitPriceRaw)) : undefined;

    lines.push({ rowNumber, productCode, quantity, unitPrice, requestedETD, priority, note });
  });

  return { lines, errors };
}

export const POST = apiHandler(async (request: NextRequest) => {
  const user = getAuthUser(request);

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  if (!file) throw new ApiError('File is required', 400);

  const buffer = Buffer.from(await file.arrayBuffer());
  const originalName = file.name;

  const job = await prisma.order_import_jobs.create({
    data: {
      tenant_id: user.tenantId,
      source_type: 'excel',
      source_ref: originalName,
      status: 'parsing',
      created_by: user.userId,
    },
  });

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
    const { lines, errors } = parseExcel(workbook);

    if (errors.length > 0) {
      await prisma.order_validation_errors.createMany({
        data: errors.map((err) => ({
          tenant_id: user.tenantId,
          import_job_id: job.id,
          row_no: err.rowNumber,
          field_name: err.field,
          error_code: 'VALIDATION',
          error_message: err.message,
        })),
      });
    }

    const status = errors.length > 0 && lines.length === 0 ? 'failed' : 'validated';

    await prisma.order_import_jobs.update({
      where: { id: job.id },
      data: {
        status,
        total_rows: lines.length + errors.length,
        valid_rows: lines.length,
        error_rows: errors.length,
        finished_at: new Date(),
      },
    });

    const result = await prisma.order_import_jobs.findUnique({
      where: { id: job.id },
      include: { order_validation_errors: true },
    });

    return json(result, 201);
  } catch (error) {
    await prisma.order_import_jobs.update({
      where: { id: job.id },
      data: { status: 'failed', finished_at: new Date() },
    });
    throw error;
  }
});
