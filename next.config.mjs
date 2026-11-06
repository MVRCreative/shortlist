/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@loople/tokens'],
  serverExternalPackages: ['deepline'],
  // Deepline is spawned as a CLI, so it isn't traced from imports; ship it with server functions.
  outputFileTracingIncludes: {
    '/**': ['./node_modules/deepline/**', './node_modules/.pnpm/deepline@*/**'],
  },
  allowedDevOrigins: ['*.vercel.run', '*.vusercontent.net', '*.v0.app', '*.v0.dev', '*.vercel.app'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}

export default nextConfig
