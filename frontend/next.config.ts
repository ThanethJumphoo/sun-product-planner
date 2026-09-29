import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  basePath: '/sun-product-planner',
  allowedDevOrigins: ['172.16.5.187', 'smartweb.sungroup.co.th', 'localhost'],
};

export default nextConfig;
