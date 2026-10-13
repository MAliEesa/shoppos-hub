/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingIncludes: {
    '/shop/[shopId]': ['./features/**/*'],
  },
};

export default nextConfig;