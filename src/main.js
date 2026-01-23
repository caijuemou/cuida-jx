import { createApp } from 'vue'
import './assets/tailwind.css' // 引入 Tailwind CSS
import App from './App.vue'
import router from './router' // 引入路由

createApp(App).use(router).mount('#app')
