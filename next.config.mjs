/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure smooth mobile experience and static/hybrid compatibility
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
