/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['canvas'],
  },
  images: {
    domains: ['localhost'],
  },
  // Disable static generation
  output: 'standalone',
}

module.exports = nextConfig
