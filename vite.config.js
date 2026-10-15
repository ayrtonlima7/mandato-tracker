import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// BASE_PATH vem do workflow de deploy (GitHub Pages serve em /mandato-tracker/); local = '/'.
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react()],
})
