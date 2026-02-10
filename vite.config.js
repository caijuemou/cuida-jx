import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    // 设置兼容目标，es2015 或更高版本
    target: 'es2015', 
  }
})
