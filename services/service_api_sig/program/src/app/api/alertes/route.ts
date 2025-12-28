import { NextRequest, NextResponse } from 'next/server';

const ALERTES_URL = process.env.ALERTES_API_URL || 'http://service_alertes:8000';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path') || '/api/alerts/history';
  
  try {
    const response = await fetch(`${ALERTES_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Alertes proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to alertes service' },
      { status: 502 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path') || '/api/alerts';
  const body = await request.json();
  
  try {
    const response = await fetch(`${ALERTES_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Alertes proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to alertes service' },
      { status: 502 }
    );
  }
}
