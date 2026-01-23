<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <header class="bg-blue-600 p-4 text-white shadow-md sticky top-0 z-20">
      <div class="flex justify-between items-center max-w-4xl mx-auto">
        <h1 class="text-xl font-bold">员工绩效系统</h1>
        <nav>
          <router-link to="/" class="mr-4 hover:underline">打分</router-link>
          <router-link to="/admin" class="hover:underline">管理</router-link>
        </nav>
      </div>
    </header>

    <main class="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
      <router-view />
    </main>

    <footer class="bg-gray-800 text-white text-center p-4 mt-auto">
      <p class="text-sm">由 Supabase & Vercel 强力驱动</p>
    </footer>
  </div>
</template>

<script setup>
// import { useRouter } from 'vue-router' // 如果需要获取当前路由信息
</script>

<style>
/* App-level styles if any */
</style>
