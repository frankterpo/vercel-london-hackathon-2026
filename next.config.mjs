/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  serverExternalPackages: ['tldraw', '@tldraw/editor', '@tldraw/store'],
}

export default nextConfig
