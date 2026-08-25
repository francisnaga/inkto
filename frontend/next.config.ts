import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  turbopack: {
    root: '.',
  },
  // Allow connections from proxy and local network for mobile testing
  allowedDevOrigins: ['172.20.10.2', '10.190.120.23', 'localhost', 'two-kids-slide.loca.lt'],
};

export default nextConfig;

