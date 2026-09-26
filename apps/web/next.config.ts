import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Um único tsconfig.json, na raiz do monorepo.
  typescript: { tsconfigPath: '../../tsconfig.json' },
}

export default nextConfig
