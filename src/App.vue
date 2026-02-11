<template>
  <div class="min-h-screen bg-gray-50 font-sans antialiased text-gray-900">
    <nav v-if="!route.meta.hideNav && userInfo.name" class="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 flex items-center justify-center overflow-hidden rounded-lg shadow-lg shadow-indigo-500/20">
            <img 
              src="/logo.jpg" 
              alt="Logo" 
              class="w-full h-full object-cover"
            />
          </div>
          <div class="text-lg font-black tracking-tighter uppercase">
            CUìDA <span class="text-indigo-600">Performance</span>
          </div>
        </div>

        <div class="hidden md:flex items-center gap-8">
          <router-link v-if="canAccessScoring" to="/" class="nav-link" active-class="active-pc">绩效评分</router-link>
          <router-link to="/dashboard" class="nav-link" active-class="active-pc">考核大屏</router-link>
          <router-link v-if="isSuperAdmin" to="/admin" class="nav-link" active-class="active-pc">系统管理</router-link>
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

    <nav v-if="!route.meta.hideNav && userInfo.name" class="md:hidden fixed bottom-6 left-4 right-4 z-[100]">
      <div class="bg-white/90 backdrop-blur-xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.2)] rounded-[2.5rem] p-2 flex justify-around items-center">
        <router-link v-if="canAccessScoring" to="/" class="mobile-nav-link" active-class="active-mobile">
          <PenToolIcon :size="20" />
          <span>评分</span>
        </router-link>

        <router-link to="/dashboard" class="mobile-nav-link" active-class="active-mobile">
          <LayoutDashboardIcon :size="20" />
          <span>大屏</span>
        </router-link>

        <router-link v-if="isSuperAdmin" to="/admin" class="mobile-nav-link" active-class="active-mobile">
          <SettingsIcon :size="20" />
          <span>管理</span>
        </router-link>
      </div>
    </nav>

    <main :class="{ 'max-w-7xl mx-auto py-8 px-6 pb-28 md:pb-8': !route.meta.hideNav }">
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
// 导入所有需要的图标
import { 
  LogOutIcon, 
  PenToolIcon, 
  ClipboardListIcon, 
  LayoutDashboardIcon, 
  SettingsIcon 
} from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();

const userInfo = ref({});

const refreshUser = () => {
  try {
    const data = localStorage.getItem('user_info');
    userInfo.value = data ? JSON.parse(data) : {};
  } catch {
    userInfo.value = {};
  }
};

onMounted(refreshUser);
watch(() => route.path, refreshUser);

// --- 权限判定 ---
const isSuperAdmin = computed(() => {
  return userInfo.value.dept_name?.includes('公司管理组') || userInfo.value.name === '蔡珏侔';
});

// 店长、店经理或管理员有权评分
const canAccessScoring = computed(() => {
  return isSuperAdmin.value || 
         userInfo.value.job_title?.includes('店经理') || 
         userInfo.value.job_title?.includes('店长');
});

const handleLogout = () => {
  if (confirm('确定要退出系统吗？')) {
    localStorage.removeItem('user_info');
    userInfo.value = {};
    router.push('/login');
  }
};
</script>

<style scoped>
/* PC端链接基础样式 */
.nav-link {
  @apply text-sm font-bold text-gray-400 hover:text-indigo-600 transition-all relative py-1;
}
/* PC端激活状态：加粗并显示下划线 */
.active-pc {
  @apply text-indigo-600 font-black;
}
.active-pc::after {
  content: '';
  @apply absolute -bottom-1 left-0 w-full h-0.5 bg-indigo-600 rounded-full;
}

/* 移动端菜单基础样式 */
.mobile-nav-link {
  @apply flex flex-col items-center gap-1 px-4 py-2 text-gray-400 transition-all duration-300;
}
.mobile-nav-link span {
  @apply text-[10px] font-black uppercase tracking-tighter;
}
/* 移动端激活状态：变色并放大 */
.active-mobile {
  @apply text-indigo-600 scale-110;
}

/* 页面切换动画 */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
