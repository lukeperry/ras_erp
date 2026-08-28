import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Frappe bench site to proxy API calls to during development. Set via
// FRAPPE_SITE_URL env var, e.g. FRAPPE_SITE_URL=http://ras-erp.localhost:8000
const frappeTarget = process.env.FRAPPE_SITE_URL ?? 'http://localhost:8000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxying keeps the dashboard same-origin with Frappe in dev too, so
      // the session cookie and CSRF token work exactly as they will in
      // production behind the reverse proxy — no CORS configuration needed.
      '/api': { target: frappeTarget, changeOrigin: true },
    },
  },
})
