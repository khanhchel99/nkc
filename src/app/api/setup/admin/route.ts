import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    // Check if admin already exists
    const existingAdmin = await db.user.findFirst({
      where: { 
        role: { name: 'admin' } 
      }
    });

    if (existingAdmin) {
      return NextResponse.json({ 
        error: 'Admin already exists',
        admin: { email: existingAdmin.email, name: existingAdmin.name }
      }, { status: 400 });
    }

    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json({ 
        error: 'Email, password, and name are required' 
      }, { status: 400 });
    }

    // Find admin role
    const adminRole = await db.role.findUnique({
      where: { name: 'admin' }
    });

    if (!adminRole) {
      return NextResponse.json({ 
        error: 'Admin role not found. Please run database migrations first.' 
      }, { status: 400 });
    }

    // Check if email is already taken
    const existingUser = await db.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ 
        error: 'Email already in use' 
      }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const admin = await db.user.create({
      data: {
        email,
        name,
        passwordHash: hashedPassword,
        roleId: adminRole.id,
        status: 'active'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: {
          select: {
            name: true
          }
        }
      }
    });

    return NextResponse.json({ 
      message: 'Admin created successfully',
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role?.name
      }
    });

  } catch (error) {
    console.error('Error creating admin:', error);
    return NextResponse.json({ 
      error: 'Failed to create admin',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Check if admin exists (for verification)
    const existingAdmin = await db.user.findFirst({
      where: { 
        role: { name: 'admin' } 
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    });

    if (existingAdmin) {
      return NextResponse.json({
        adminExists: true,
        admin: existingAdmin
      });
    }

    return NextResponse.json({
      adminExists: false,
      message: 'No admin user found'
    });

  } catch (error) {
    console.error('Error checking admin:', error);
    return NextResponse.json({ 
      error: 'Failed to check admin status' 
    }, { status: 500 });
  }
}
