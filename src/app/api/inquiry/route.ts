import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { db } from "@/server/db";

export async function POST(req: Request) {
  try {
    const { name, email, mobile, service, note } = await req.json();

    // Validate required fields
    if (!name || !email || !mobile || !service) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Save to database
    const inquiry = await db.inquiryForm.create({
      data: {
        name,
        email,
        mobile,
        service,
        note: note || "",
      },
    });

    // Create email transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Compose email
    const mailOptions = {
      from: process.env.EMAIL_FROM || "noreply@example.com",
      to: "khanhnguyen1999pro@gmail.com",
      subject: "New Inquiry from Website",
      html: `
        <h2>New Inquiry Details:</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Mobile:</strong> ${mobile}</p>
        <p><strong>Service:</strong> ${service}</p>
        <p><strong>Note:</strong> ${note || "No additional notes"}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, data: inquiry });
  } catch (error) {
    console.error("Error submitting inquiry:", error);
    return NextResponse.json(
      { error: "Failed to submit inquiry" },
      { status: 500 }
    );
  }
}