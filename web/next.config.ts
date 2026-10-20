import type { NextConfig } from 'next'

const config: NextConfig = {
  output: 'export',
  basePath: '/answerthis',
  images: { unoptimized: true },
}

export default config
