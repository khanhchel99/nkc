/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@nkc/types', '@nkc/validation', '@nkc/config', '@nkc/database', '@nkc/utils'],
  experimental: {
    serverComponentsExternalPackages: ['bcrypt'],
  },
};

module.exports = nextConfig;
