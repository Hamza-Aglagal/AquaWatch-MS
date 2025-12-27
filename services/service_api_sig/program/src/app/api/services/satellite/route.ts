import { NextRequest, NextResponse } from 'next/server';
import { SERVICE_URLS, proxyGet, proxyPost } from '@/lib/api-gateway';

// GET /api/services/satellite - Satellite data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint') || 'health';
    
    // Map to actual satellite service paths
    let path = '/health';
    if (endpoint === 'indices') {
      path = '/api/satellite/indices/latest';
    } else if (endpoint === 'indices-location') {
      const lat = searchParams.get('lat');
      const lon = searchParams.get('lon');
      const radius = searchParams.get('radius') || '10';
      path = `/api/satellite/indices/location?lat=${lat}&lon=${lon}&radius_km=${radius}`;
    } else if (endpoint === 'images') {
      path = '/api/satellite/images';
    } else if (endpoint === 'health') {
      path = '/api/satellite/health';
    }
    
    const { data, status } = await proxyGet(SERVICE_URLS.satellite, path);
    return NextResponse.json(data, { status });
  } catch (error) {
    console.error('Satellite API error:', error);
    return NextResponse.json(
      { error: 'Service satellite indisponible', details: String(error) },
      { status: 502 }
    );
  }
}

// POST /api/services/satellite - Create satellite image
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const path = '/api/satellite/images';
    
    const { data, status } = await proxyPost(SERVICE_URLS.satellite, path, body);
    return NextResponse.json(data, { status });
  } catch (error) {
    console.error('Satellite API error:', error);
    return NextResponse.json(
      { error: 'Service satellite indisponible', details: String(error) },
      { status: 502 }
    );
  }
}
