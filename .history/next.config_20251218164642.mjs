/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Explicitly enable SWC
    forceSwcTransforms: true,
  },
};

export default nextConfig;
