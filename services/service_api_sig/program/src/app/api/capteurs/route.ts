import { NextRequest, NextResponse } from 'next/server';

const SERVICE_URLS = {
  capteurs: process.env.CAPTEURS_API_URL || 'http://service_capteurs:8000',
  satellite: process.env.SATELLITE_API_URL || 'http://service_satellite:8000',
  stmodel: process.env.STMODEL_API_URL || 'http://service_stmodel:8000',
  alertes: process.env.ALERTES_API_URL || 'http://service_alertes:8000',
};

// Proxy to capteurs service
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  // Default to /api/capteurs for listing sensors
  const path = searchParams.get('path') || '/api/capteurs';
  
  try {
    const response = await fetch(`${SERVICE_URLS.capteurs}${path}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Capteurs proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to capteurs service' },
      { status: 502 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path') || '/sensors';
  const body = await request.json();
  
  try {
    const response = await fetch(`${SERVICE_URLS.capteurs}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Capteurs proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to capteurs service' },
      { status: 502 }
    );
  }
}
