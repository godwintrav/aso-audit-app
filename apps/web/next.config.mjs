/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // @aso/schemas is consumed for its types only; transpile it so Next can
  // resolve the workspace source without a prior build step.
  transpilePackages: ["@aso/schemas", "@aso/core"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.mzstatic.com" },
      { protocol: "https", hostname: "apps.apple.com" },
    ],
  },
  async rewrites() {
    const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
    return [{ source: "/api/:path*", destination: `${api}/:path*` }];
  },
};

export default nextConfig;
