import { NextResponse } from 'next/server';

export async function GET() {
  return new NextResponse(
    JSON.stringify({ 
      success: true, 
      message: 'Cache cleared. Your quiz progress has been preserved. Please refresh the page.' 
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Clear-Site-Data': '"cache"',
      },
    }
  );
}
