import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pg", "@prisma/adapter-pg"],
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000', // Replace with your specific port, e.g., '8000'
        pathname: '/**', // Matches all paths
      },
    ],
  },
};

export default nextConfig;
