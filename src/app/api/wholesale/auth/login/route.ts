import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const db = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find the wholesale user
    const user = await (db as any).wholesaleUser.findUnique({
      where: { email },
      include: {
        company: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Check if user is active
    if (user.status !== "active") {
      return NextResponse.json(
        { error: "Account is inactive" },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        companyId: user.companyId,
        roleId: user.roleId,
        email: user.email,
      },
      process.env.WHOLESALE_JWT_SECRET || "fallback-secret-key",
      { expiresIn: "24h" }
    );

    // Update last login
    await (db as any).wholesaleUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Create session
    await (db as any).wholesaleSession.create({
      data: {
        sessionToken: token,
        userId: user.id,
        companyId: user.companyId,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.displayName,
        company: user.company.name,
      },
    });

  } catch (error) {
    console.error("Wholesale login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
