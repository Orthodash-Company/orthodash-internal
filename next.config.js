/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['canvas'],
  },
  images: {
    domains: ['localhost'],
  },
}

module.exports = nextConfig
