/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  
  // Turbopack config (Next.js 16+)
  turbopack: {},

  // Optimize images
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: 'geoserver',
      },
    ],
    unoptimized: true,
  },

  // Environment variables that should be available in the browser
  env: {
    NEXT_PUBLIC_API_CAPTEURS_URL: process.env.NEXT_PUBLIC_API_CAPTEURS_URL,
    NEXT_PUBLIC_API_SATELLITE_URL: process.env.NEXT_PUBLIC_API_SATELLITE_URL,
    NEXT_PUBLIC_API_STMODEL_URL: process.env.NEXT_PUBLIC_API_STMODEL_URL,
    NEXT_PUBLIC_API_ALERTES_URL: process.env.NEXT_PUBLIC_API_ALERTES_URL,
    NEXT_PUBLIC_API_GEO_URL: process.env.NEXT_PUBLIC_API_GEO_URL,
    NEXT_PUBLIC_GEOSERVER_URL: process.env.NEXT_PUBLIC_GEOSERVER_URL,
  },

  // Headers for CORS
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-Requested-With, Accept, Content-Type' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
