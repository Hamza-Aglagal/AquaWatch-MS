import { NextRequest, NextResponse } from 'next/server';

const STMODEL_URL = process.env.STMODEL_API_URL || 'http://service_stmodel:8000';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path') || '/predictions';
  
  try {
    const response = await fetch(`${STMODEL_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('STModel proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to stmodel service' },
      { status: 502 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path') || '/predict';
  const body = await request.json();
  
  try {
    const response = await fetch(`${STMODEL_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('STModel proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to stmodel service' },
      { status: 502 }
    );
  }
}
