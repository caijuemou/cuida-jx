<template>
  <div class="min-h-screen bg-gray-50 font-sans antialiased text-gray-900">
    <nav v-if="!route.meta.hideNav && userInfo.name" class="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-100">
            <span class="text-white font-black text-xs">C</span>
          </div>
          <div class="text-lg font-black tracking-tighter uppercase">
            CUIDA <span class="text-indigo-600">Performance</span>
          </div>
        </div>

        <div class="hidden md:flex items-center gap-8">
          <router-link v-if="canAccessScoring" to="/" class="nav-link" active-class="text-indigo-600 font-black">绩效评分</router-link>
          <router-link v-if="isSuperAdmin" to="/admin" class="nav-link" active-class="text-indigo-600 font-black">系统管理</router-link>
          <router-link to="/dashboard" class="nav-link" active-class="text-indigo-600 font-black">考核大屏</router-link>
        </div>

        <div class="flex items-center gap-4 border-l pl-6 border-gray-100">
          <div class="text-right hidden sm:block">
            <div class="text-xs font-black text-gray-900 leading-none">{{ userInfo.name }}</div>
            <div class="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tighter">{{ userInfo.dept_name }}</div>
          </div>
          <button @click="handleLogout" class="p-2 text-gray-300 hover:text-rose-500 transition-colors" title="退出系统">
            <LogOutIcon :size="20" />
          </button>
        </div>
      </div>
    </nav>

    <main :class="{ 'max-w-7xl mx-auto py-8 px-6': !route.meta.hideNav }">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { LogOutIcon } from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();

// 1. 响应式用户信息
const userInfo = ref({});

// 2. 更新方法
const refreshUser = () => {
  try {
    const data = localStorage.getItem('user_info');
    userInfo.value = data ? JSON.parse(data) : {};
  } catch {
    userInfo.value = {};
  }
};

onMounted(refreshUser);

// 3. 核心：监听路由变化同步登录状态
watch(() => route.path, refreshUser);

// 4. 权限计算
const isSuperAdmin = computed(() => userInfo.value.dept_name === '公司管理组' || userInfo.value.name === '蔡珏侔');
const canAccessScoring = computed(() => isSuperAdmin.value || userInfo.value.job_title?.includes('店经理'));

// 5. 退出登录
const handleLogout = () => {
  if (confirm('确定要退出系统吗？')) {
    localStorage.removeItem('user_info');
    userInfo.value = {};
    router.push('/login');
  }
};
</script>

<style scoped>
.nav-link {
  @apply text-sm font-bold text-gray-400 hover:text-indigo-600 transition-all;
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>