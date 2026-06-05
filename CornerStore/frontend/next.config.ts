import type { NextConfig } from "next";

function getBackendOrigin(): string {
  const internal = process.env.API_INTERNAL_URL?.replace(/\/api\/?$/i, "");
  if (internal) return internal.replace(/\/$/, "");
  const publicOrigin = process.env.NEXT_PUBLIC_API_ORIGIN?.replace(/\/$/, "");
  if (publicOrigin) return publicOrigin;
  return "http://localhost:5141";
}

const nextConfig: NextConfig = {
  images: {
    unoptimized: process.env.NEXT_PUBLIC_UNOPTIMIZED_IMAGES === "true",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "5141",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "localhost",
        port: "7275",
        pathname: "/**",
      },
    ],
  },
  async rewrites() {
    const backend = getBackendOrigin();
    return [
      {
        source: "/images/products/:path*",
        destination: `${backend}/images/products/:path*`,
      },
    ];
  },
  allowedDevOrigins: ["192.168.1.3"],
};

export default nextConfig;
