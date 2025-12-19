/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force SWC compiler usage even with custom babel config
  swcMinify: true,
  experimental: {
    // Explicitly enable SWC
    forceSwcTransforms: true,
  },
};

export default nextConfig;
