import { NextRequest, NextResponse } from 'next/server';

// Cart functionality disabled for wholesale-only business model
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Cart functionality is not available. Please contact us for wholesale pricing and orders.' }, 
    { status: 410 }
  );
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'Cart functionality is not available. Please contact us for wholesale pricing and orders.' }, 
    { status: 410 }
  );
}
