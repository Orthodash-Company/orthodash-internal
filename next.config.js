/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  // Use standalone mode for API routes
  output: 'standalone',
}

module.exports = nextConfig
