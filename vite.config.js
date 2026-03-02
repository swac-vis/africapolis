import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // GitHub Pages: set VITE_BASE_URL=/africapolis/ in Actions; local/FileZilla use /
  base: process.env.VITE_BASE_URL || '/',
})
