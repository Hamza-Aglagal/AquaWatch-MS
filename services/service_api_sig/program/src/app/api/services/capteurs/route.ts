import { NextRequest, NextResponse } from 'next/server';
import { SERVICE_URLS, proxyGet, proxyPost } from '@/lib/api-gateway';

// GET /api/services/capteurs - Proxy to capteurs service
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint') || 'capteurs';
    
    // Map frontend endpoints to actual capteurs service paths
    let path = '/api/capteurs';
    if (endpoint === 'health') path = '/health';
    else if (endpoint === 'positions') path = '/api/capteurs/positions';
    else if (endpoint === 'latest') path = '/api/capteurs/data/latest';
    else if (endpoint === 'mesures') {
      const capteurId = searchParams.get('capteur_id');
      if (capteurId) {
        path = `/api/capteurs/${capteurId}/mesures`;
      }
    }
    
    const { data, status } = await proxyGet(SERVICE_URLS.capteurs, path);
    return NextResponse.json(data, { status });
  } catch (error) {
    console.error('Capteurs API error:', error);
    return NextResponse.json(
      { error: 'Service capteurs indisponible', details: String(error) },
      { status: 502 }
    );
  }
}

// POST /api/services/capteurs - Create sensor or add measurement
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint') || 'mesures';
    const body = await request.json();
    
    let path = '/api/capteurs/mesures';
    if (endpoint === 'capteurs') path = '/api/capteurs';
    
    const { data, status } = await proxyPost(SERVICE_URLS.capteurs, path, body);
    return NextResponse.json(data, { status });
  } catch (error) {
    console.error('Capteurs API error:', error);
    return NextResponse.json(
      { error: 'Service capteurs indisponible', details: String(error) },
      { status: 502 }
    );
  }
}
