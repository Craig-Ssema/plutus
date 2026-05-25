// Vite configuration with source map handling
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0', // Allow network access
    port: 3000,
    open: true,
  },
  build: {
    sourcemap: false, // Disable source maps in production
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress source map warnings
        if (warning.code === 'SOURCEMAP_ERROR') {
          return
        }
        warn(warning)
      }
    }
  },
  optimizeDeps: {
    exclude: ['@radix-ui/*'] // Exclude Radix UI from optimization to prevent warnings
  }
})
