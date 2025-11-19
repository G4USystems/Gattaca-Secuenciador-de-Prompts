/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  // Increase API routes body size limit
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
    responseLimit: '50mb',
  },
}

module.exports = nextConfig
