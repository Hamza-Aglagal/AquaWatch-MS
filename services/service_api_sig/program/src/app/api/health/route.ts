import { NextResponse } from 'next/server';
import { SERVICE_URLS } from '@/lib/api-gateway';

interface ServiceHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: number;
  details?: any;
  error?: string;
}

async function checkService(name: string, url: string): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
    
    const response = await fetch(`${url}/health`, {
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      const data = await response.json();
      return {
        status: 'healthy',
        responseTime,
        details: data,
      };
    } else {
      return {
        status: 'degraded',
        responseTime,
        error: `HTTP ${response.status}`,
      };
    }
  } catch (error: any) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error.name === 'AbortError' ? 'Timeout' : error.message,
    };
  }
}

export async function GET() {
  const startTime = Date.now();
  
  // Check all services in parallel
  const [capteurs, satellite, stmodel, alertes] = await Promise.all([
    checkService('capteurs', SERVICE_URLS.capteurs),
    checkService('satellite', SERVICE_URLS.satellite),
    checkService('stmodel', SERVICE_URLS.stmodel),
    checkService('alertes', SERVICE_URLS.alertes),
  ]);
  
  const services = { capteurs, satellite, stmodel, alertes };
  
  // Calculate overall status
  const statuses = Object.values(services).map(s => s.status);
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  
  if (statuses.every(s => s === 'unhealthy')) {
    overallStatus = 'unhealthy';
  } else if (statuses.some(s => s !== 'healthy')) {
    overallStatus = 'degraded';
  }
  
  const healthyCount = statuses.filter(s => s === 'healthy').length;
  const totalCount = statuses.length;
  
  return NextResponse.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    totalResponseTime: Date.now() - startTime,
    summary: `${healthyCount}/${totalCount} services healthy`,
    services,
  });
}
