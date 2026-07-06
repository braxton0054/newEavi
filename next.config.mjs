/** @type {import('next').NextConfig} */
const nextConfig = {
  serverRuntimeConfig: {
    maxBodySize: "10mb",
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
