/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  experimental: {
    // Proxy buffers request bodies; keep above our 10MB upload limit to avoid truncated multipart payloads.
    proxyClientMaxBodySize: "20mb",
  },
};

module.exports = nextConfig;
