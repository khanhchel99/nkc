import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      threadId, 
      to, 
      subject, 
      htmlContent, 
      textContent, 
      emailType = 'admin_reply',
      isFromAdmin = true 
    } = body;

    // Validate required fields
    if (!threadId || !to || !subject || !htmlContent) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Check if email thread exists
    const emailThread = await db.emailThread.findUnique({
      where: { id: threadId }
    });

    if (!emailThread) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email thread not found' 
      }, { status: 404 });
    }

    // Create email transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Email options with threading headers
    const mailOptions = {
      from: `NKC Furniture <${process.env.EMAIL_FROM}>`,
      to,
      subject: subject.startsWith('Re: ') ? subject : `Re: ${subject}`,
      html: htmlContent,
      text: textContent,
      inReplyTo: emailThread.threadId,
      references: emailThread.threadId,
      headers: {
        'X-Thread-ID': emailThread.threadId,
        'X-Inquiry-ID': emailThread.inquiryId
      }
    };

    // Send email
    const result = await transporter.sendMail(mailOptions);

    // Save email to database
    const savedEmail = await db.email.create({
      data: {
        threadId: threadId,
        messageId: result.messageId || `msg-${uuidv4()}`,
        fromEmail: process.env.EMAIL_FROM || 'sales@nkcfurniture.com',
        toEmail: to,
        subject: mailOptions.subject,
        htmlContent,
        textContent,
        emailType,
        isFromAdmin,
      }
    });

    console.log(`Email sent and saved: ${savedEmail.id} in thread ${threadId}`);

    return NextResponse.json({ 
      success: true, 
      messageId: result.messageId,
      emailId: savedEmail.id,
      threadId: threadId,
      message: 'Email sent and saved successfully' 
    });

  } catch (error) {
    console.error('Email reply error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to send email reply' 
    }, { status: 500 });
  }
}
