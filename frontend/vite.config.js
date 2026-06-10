import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['lucide-react'], 
          'monaco': ['@monaco-editor/react'],
          'qr': ['html5-qrcode', 'react-qr-code', 'qrcode'],
          'syntax': ['react-syntax-highlighter'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
})
