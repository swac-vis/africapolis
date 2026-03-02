import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages: https://swac-vis.github.io/africapolis/ → base: '/africapolis/'
// Local / other hosts: base: '/'
const base = process.env.VITE_BASE || '/'

export default defineConfig({
  base,
  plugins: [react()],
})
