import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { getCurrentUser } from '../../../lib/server-auth';
import { AuthService } from '../../../lib/auth-service';

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (!AuthService.isAdmin(user)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { format = 'csv', filters } = body;

    // Build where clause
    const where: any = {};

    if (filters) {
      const { search, status, userId, minTotal, maxTotal, startDate, endDate } = filters;

      if (search) {
        where.OR = [
          { id: { contains: search, mode: 'insensitive' } },
          { user: { name: { contains: search, mode: 'insensitive' } } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
        ];
      }

      if (status) where.status = status;
      if (userId) where.userId = userId;
      if (minTotal || maxTotal) {
        where.total = {};
        if (minTotal) where.total.gte = minTotal;
        if (maxTotal) where.total.lte = maxTotal;
      }
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }
    }

    // Fetch orders
    const orders = await db.order.findMany({
      where,
      include: {
        user: {
          include: { role: true }
        },
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Format export data
    const exportData = orders.map(order => ({
      id: order.id,
      customerName: order.user.name || 'N/A',
      customerEmail: order.user.email || 'N/A',
      customerPhone: order.user.phone || 'N/A',
      status: order.status,
      total: Number(order.total),
      itemCount: order.items.length,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      items: order.items.map(item => ({
        productName: item.product.nameEn,
        quantity: item.quantity,
        price: Number(item.price)
      }))
    }));

    return NextResponse.json({
      data: exportData,
      format,
      timestamp: new Date().toISOString(),
      totalRecords: exportData.length
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
