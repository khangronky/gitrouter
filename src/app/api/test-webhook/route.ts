import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  console.log('=== TEST WEBHOOK HIT ===');
  console.log('Method:', request.method);
  console.log('URL:', request.url);
  
  try {
    const body = await request.text();
    console.log('Body length:', body.length);
    console.log('Body preview:', body.substring(0, 100));
  } catch (e) {
    console.log('Error reading body:', e);
  }
  
  return NextResponse.json({ received: true, timestamp: new Date().toISOString() });
}

export async function GET() {
  console.log('=== TEST WEBHOOK GET ===');
  return NextResponse.json({ status: 'ok' });
}

