/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    authInterrupts: true,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/suppliers',
        destination: '/companies',
        permanent: true,
      },
      {
        source: '/brand',
        destination: '/products/brands',
        permanent: true,
      },
      {
        source: '/brands',
        destination: '/products/brands',
        permanent: true,
      },
      {
        source: '/categories/:slug*',
        destination: '/products/category/:slug*',
        permanent: true,
      },
    ];
  },
  images: {
    // Disable optimization in development to prevent timeout errors
    unoptimized: process.env.NODE_ENV === 'development',
    
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.bzion.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.legal500.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'encrypted-tbn0.gstatic.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.bofikng.com',
        pathname: '/**',
      },
    ],
    // Cache optimized images for 1 year in production
    minimumCacheTTL: 31536000,
    // Improved device sizes for better responsiveness
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/avif', 'image/webp'],
    qualities: [75, 80, 85],
    dangerouslyAllowSVG: true,
  },
};

export default nextConfig;
