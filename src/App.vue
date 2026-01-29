<template>
  <div class="min-h-screen bg-gray-50">
    <nav v-if="!$route.meta.hideNav && userInfo.name" class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div class="text-lg font-black text-gray-900 tracking-tighter">
          CUIDA <span class="text-indigo-600">绩效考核</span>
        </div>

        <div class="flex items-center gap-12">
          <router-link v-if="canAccessScoring" to="/" class="nav-link" active-class="active-link">打分</router-link>
          <router-link v-if="isSuperAdmin" to="/admin" class="nav-link" active-class="active-link">管理</router-link>
          <router-link to="/dashboard" class="nav-link" active-class="active-link">大屏</router-link>
        </div>

        <div class="hidden md:flex flex-col items-end leading-none">
          <span class="text-[10px] text-indigo-600 font-black">{{ userInfo.name }}</span>
          <span class="text-[9px] text-gray-300 font-bold mt-1">{{ userInfo.dept_name }}</span>
        </div>
      </div>
    </nav>

    <main :class="{'max-w-7xl mx-auto py-8 px-6': !$route.meta.hideNav}">
      <router-view></router-view>
    </main>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

// 1. 统一使用 ref，初始值为空对象
const userInfo = ref({});

// 2. 定义更新方法：从本地存储读取并赋值给 ref
const refreshUser = () => {
  try {
    const data = localStorage.getItem('user_info');
    userInfo.value = data ? JSON.parse(data) : {};
  } catch (e) {
    console.error("解析用户信息失败", e);
    userInfo.value = {};
  }
};

// 3. 初始加载执行一次
onMounted(refreshUser);

// 4. 路由变化时（例如登录成功跳转后）重新读取
watch(() => route.path, refreshUser);

// 5. 权限计算属性（基于 userInfo.value）
const isSuperAdmin = computed(() => {
  return userInfo.value.dept_name === '公司管理组' || userInfo.value.name === '蔡珏侔';
});

const canAccessScoring = computed(() => {
  return isSuperAdmin.value || userInfo.value.job_title?.includes('店长');
});
</script>