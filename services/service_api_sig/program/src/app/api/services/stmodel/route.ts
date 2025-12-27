import { NextRequest, NextResponse } from 'next/server';
import { SERVICE_URLS, proxyGet, proxyPost } from '@/lib/api-gateway';

// GET /api/services/stmodel - ML Predictions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint') || 'health';
    
    // Map to actual stmodel service paths
    let path = '/health';
    if (endpoint === 'predictions') {
      const limit = searchParams.get('limit') || '10';
      path = `/api/predictions/latest?limit=${limit}`;
    } else if (endpoint === 'model-info') {
      path = '/api/model/info';
    } else if (endpoint === 'zones') {
      // The stmodel uses the database for zones
      path = '/api/data/fetch';
    } else if (endpoint === 'auto') {
      path = '/api/predictions/auto';
    }
    
    const { data, status } = await proxyGet(SERVICE_URLS.stmodel, path);
    return NextResponse.json(data, { status });
  } catch (error) {
    console.error('STModel API error:', error);
    return NextResponse.json(
      { error: 'Service STModel indisponible', details: String(error) },
      { status: 502 }
    );
  }
}

// POST /api/services/stmodel - Create prediction
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint') || 'predict';
    const body = await request.json();
    
    // Map to actual stmodel service paths
    let path = '/api/predictions/create';
    if (endpoint === 'auto') path = '/api/predictions/auto';
    else if (endpoint === 'fetch') path = '/api/data/fetch';
    
    const { data, status } = await proxyPost(SERVICE_URLS.stmodel, path, body);
    return NextResponse.json(data, { status });
  } catch (error) {
    console.error('STModel API error:', error);
    return NextResponse.json(
      { error: 'Service STModel indisponible', details: String(error) },
      { status: 502 }
    );
  }
}
