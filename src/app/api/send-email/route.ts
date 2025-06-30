import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, htmlContent, textContent, inReplyTo, references } = body;

    // Create email transporter using existing configuration
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Email options
    const mailOptions: any = {
      from: `NKC Furniture <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html: htmlContent,
      text: textContent,
    };

    // Add threading headers if this is a reply
    if (inReplyTo) {
      mailOptions.inReplyTo = inReplyTo;
      mailOptions.references = references || inReplyTo;
    }

    // Send email
    const result = await transporter.sendMail(mailOptions);

    return NextResponse.json({ 
      success: true, 
      messageId: result.messageId,
      message: 'Email sent successfully' 
    });

  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to send email' 
    }, { status: 500 });
  }
}
