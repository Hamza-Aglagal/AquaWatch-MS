import { NextRequest, NextResponse } from 'next/server';
import { SERVICE_URLS, proxyGet, proxyPost } from '@/lib/api-gateway';

// GET /api/services/alertes - Alerts management
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint') || 'health';
    
    let path = '/health';
    if (endpoint === 'history') {
      const type = searchParams.get('type');
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      path = `/api/alerts/history${params.toString() ? `?${params.toString()}` : ''}`;
    } else if (endpoint === 'recipients') {
      path = '/api/recipients';
    } else if (endpoint === 'stats') {
      path = '/api/alerts/stats';
    }
    
    const { data, status } = await proxyGet(SERVICE_URLS.alertes, path);
    return NextResponse.json(data, { status });
  } catch (error) {
    console.error('Alertes API error:', error);
    return NextResponse.json(
      { error: 'Service alertes indisponible', details: String(error) },
      { status: 502 }
    );
  }
}

// POST /api/services/alertes - Create alert or test
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint') || 'create';
    const body = await request.json();
    
    let path = '/api/alerts';
    if (endpoint === 'test') path = '/api/alerts/test';
    else if (endpoint === 'subscribe') path = '/api/recipients';
    
    const { data, status } = await proxyPost(SERVICE_URLS.alertes, path, body);
    return NextResponse.json(data, { status });
  } catch (error) {
    console.error('Alertes API error:', error);
    return NextResponse.json(
      { error: 'Service alertes indisponible', details: String(error) },
      { status: 502 }
    );
  }
}
