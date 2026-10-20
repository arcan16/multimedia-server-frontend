import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'

/**
 * Content-Security-Policy for the production build only: the dev server
 * needs inline scripts for Fast Refresh. Inline `style` attributes are used
 * by React components, so style-src keeps 'unsafe-inline'.
 */
function contentSecurityPolicy(apiUrl) {
  const apiOrigin = /^https?:\/\//.test(apiUrl) ? new URL(apiUrl).origin : ''
  const policy = [
    "default-src 'self'",
    "script-src 'self'",
    `connect-src 'self' ${apiOrigin}`,
    `media-src 'self' ${apiOrigin} blob:`,
    "img-src 'self' blob: data:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    'font-src https://fonts.gstatic.com',
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ]
    .map((directive) => directive.replace(/\s+/g, ' ').trim())
    .join('; ')

  return {
    name: 'content-security-policy',
    apply: 'build',
    transformIndexHtml: () => [
      { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: policy }, injectTo: 'head-prepend' },
    ],
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiUrl = env.VITE_API_URL || '/api'
  const proxyTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:8080'

  return {
    plugins: [react(), contentSecurityPolicy(apiUrl)],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      // The browser calls /api on its own origin, so no CORS is involved.
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    preview: {
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  }
})
