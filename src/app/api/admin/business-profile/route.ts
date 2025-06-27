import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '../../../../lib/server-auth';
import { AuthService } from '../../../../lib/auth-service';
import { db } from '../../../../server/db';

const businessProfileSchema = z.object({
  userId: z.string(),
  companyName: z.string().min(1, 'Company name is required'),
  taxId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (!AuthService.isAdmin(user)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = businessProfileSchema.parse(body);

    // Create business profile
    const businessProfile = await db.businessProfile.create({
      data: {
        userId: validatedData.userId,
        companyName: validatedData.companyName,
        taxId: validatedData.taxId,
        verified: true, // Admin-created profiles are auto-verified
      },
    });

    return NextResponse.json(
      { 
        message: 'Business profile created successfully',
        businessProfile
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Business profile creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
