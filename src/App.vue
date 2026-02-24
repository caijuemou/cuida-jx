<template>
  <div class="min-h-screen bg-[#F8FAFC] font-sans antialiased text-slate-900">
    
    <!-- 顶部导航栏 -->
    <header v-if="!route.meta.hideNav && userInfo.name"
            class="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100">
      <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        <!-- 左侧Logo区域 -->
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl shadow-inner overflow-hidden border border-slate-100 bg-white">
            <img src="/logo.jpg" alt="Logo" class="w-full h-full object-cover" />
          </div>
          <div class="flex flex-col">
            <span class="text-sm font-black tracking-tight leading-none uppercase">CUìDA</span>
            <span class="text-[10px] text-indigo-500 font-bold uppercase tracking-widest leading-none mt-1">Performance</span>
          </div>
        </div>

        <!-- 导航菜单 -->
        <nav class="hidden md:flex items-center bg-slate-100/50 p-1 rounded-2xl border border-slate-200/50">
          <!-- 绩效评分（仅限有权限用户） -->
          <router-link v-if="canAccessScoring" to="/" class="pc-nav-link" active-class="pc-active">
            <PenToolIcon :size="16" /> 绩效评分
          </router-link>
          
          <!-- 考核大屏（所有用户） -->
          <router-link to="/dashboard" class="pc-nav-link" active-class="pc-active">
            <LayoutDashboardIcon :size="16" /> 考核大屏
          </router-link>

          <!-- 评分历史（仅限无评分权限用户） -->
          <router-link v-if="!canAccessScoring" to="/history" class="pc-nav-link" active-class="pc-active">
            <ClipboardListIcon :size="16" /> 评分历史
          </router-link>

          <!-- 系统管理（仅限超级管理员） -->
          <router-link v-if="isSuperAdmin" to="/admin" class="pc-nav-link" active-class="pc-active">
            <SettingsIcon :size="16" /> 系统管理
          </router-link>
        </nav>

        <!-- 用户信息和退出按钮 -->
        <div class="flex items-center gap-4 border-l pl-6 border-slate-100">
          <div class="text-right hidden sm:block">
            <div class="text-xs font-black text-slate-900 leading-none">{{ userInfo.name }}</div>
            <div class="text-[9px] text-slate-400 font-bold mt-1 uppercase italic tracking-tighter">
              {{ userInfo.dept_name }}
            </div>
          </div>
          <button @click="handleLogout" class="p-2.5 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
            <LogOutIcon :size="18" />
          </button>
        </div>
      </div>
    </header>

    <!-- 移动端底部导航 -->
    <nav v-if="!route.meta.hideNav && userInfo.name"
         class="md:hidden fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-4 w-full max-w-fit">
      <div class="bg-slate-900/90 backdrop-blur-2xl p-2 rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border border-white/10 flex items-center gap-1">
        
        <!-- 评分（仅限有权限用户） -->
        <router-link v-if="canAccessScoring" to="/" class="dock-link" active-class="dock-active">
          <PenToolIcon :size="20" />
        </router-link>

        <!-- 评分历史（仅限无评分权限用户） -->
        <template v-if="!canAccessScoring">
          <router-link to="/history" class="dock-link" active-class="dock-active">
            <ClipboardListIcon :size="20" />
          </router-link>
          <div class="dock-divider"></div>
        </template>

        <!-- 考核大屏（所有用户） -->
        <router-link to="/dashboard" class="dock-link" active-class="dock-active">
          <LayoutDashboardIcon :size="20" />
        </router-link>

        <!-- 系统管理（仅限超级管理员） -->
        <template v-if="isSuperAdmin">
          <div class="dock-divider"></div>
          <router-link to="/admin" class="dock-link" active-class="dock-active">
            <SettingsIcon :size="20" />
          </router-link>
        </template>
      </div>
    </nav>

    <!-- 主内容区域 -->
    <main :class="{ 'max-w-7xl mx-auto pt-6 px-4 pb-32 md:pb-12': !route.meta.hideNav }">
      <router-view v-slot="{ Component }">
        <transition name="page-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- 权限不足提示 -->
    <div v-if="showPermissionDenied" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="bg-red-50 border border-red-200 rounded-[2.5rem] p-6 text-center max-w-md w-full">
        <ExclamationTriangleIcon class="mx-auto h-12 w-12 text-red-400 mb-4" />
        <h3 class="text-lg font-black text-red-800 mb-2">权限不足</h3>
        <p class="text-sm text-red-600 mb-4">您没有访问该页面的权限</p>
        <button @click="handlePermissionDeniedClose" class="px-4 py-2 bg-red-600 text-white rounded-xl font-black hover:bg-red-700 transition-all">
          返回
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  LogOutIcon, PenToolIcon, LayoutDashboardIcon,
  SettingsIcon, ClipboardListIcon, ExclamationTriangleIcon
} from 'lucide-vue-next';
import {
  canAccessScoring,
  isSuperAdmin,
  canViewAllRecords,
  canViewDeptRecords,
  canEditRecord,
  canDeleteRecord,
  getPermissionInfo,
  isValidUser
} from '@/utils/permissions';

const route = useRoute();
const router = useRouter();
const userInfo = ref({});

// 权限不足提示
const showPermissionDenied = ref(false);

// 刷新用户信息逻辑
const refreshUser = () => {
  // 1. 检查 URL 是否带 data 参数
  const params = new URLSearchParams(window.location.search);
  const hasData = params.has('data');

  // 2. 如果当前在登录页，或者 URL 带着 data 参数（准备去登录页解析）
  // 我们不需要在 App.vue 做拦截，直接放行
  if (route.path === '/login' || hasData) {
    return;
  }

  // 3. 常规检查本地缓存
  const localData = localStorage.getItem('user_info');
  if (localData) {
    try {
      const parsed = JSON.parse(localData);
      if (parsed && parsed.name) {
        userInfo.value = parsed;
        return; // 验证通过
      }
    } catch (e) {
      localStorage.removeItem('user_info');
    }
  }

  // 4. 终极拦截：既没登录态，也不是要去登录，强制送去登录页
  if (!route.meta.hideNav) {
    console.warn('[Auth] 无合法身份，引导至登录页');
    router.replace('/login');
  }
};

// 检查页面权限
const checkPagePermission = () => {
  const currentPath = route.path.toLowerCase();
  
  // 检查是否需要权限
  if (route.meta.requiresAuth && !isValidUser(userInfo.value)) {
    router.replace('/login');
    return false;
  }
  
  // 检查特定页面的权限
  switch (currentPath) {
    case '/admin':
      if (!isSuperAdmin(userInfo.value)) {
        showPermissionDenied.value = true;
        return false;
      }
      break;
    case '/':
      if (!canAccessScoring(userInfo.value)) {
        router.replace('/history');
        return false;
      }
      break;
    case '/score':
      if (!canAccessScoring(userInfo.value)) {
        router.replace('/history');
        return false;
      }
      break;
    default:
      // 其他页面默认允许访问
      break;
  }
  
  return true;
};

onMounted(() => {
  refreshUser();
  checkPagePermission();
});

// 监听路由变化
watch(() => route.path, (newPath) => {
  // 每次切页面都校准一次身份，防止手动清除 storage 绕过
  refreshUser();
  checkPagePermission();
});

// --- 权限判定 (使用统一的权限工具函数) ---
const isSuperAdmin = computed(() => isSuperAdmin(userInfo.value));
const canAccessScoring = computed(() => canAccessScoring(userInfo.value));
const canViewAllRecords = computed(() => canViewAllRecords(userInfo.value));
const permissionInfo = computed(() => getPermissionInfo(userInfo.value));

const handleLogout = () => {
  if (confirm('确定要退出系统吗？')) {
    // 1. 清除所有相关缓存
    localStorage.clear();
    sessionStorage.clear(); // 建议同时也清理下 session
    
    // 2. 立即重置响应式数据，防止导航栏依然显示原信息
    userInfo.value = {};
    
    // 3. 使用 Vue Router 跳转到登录页，保持路由状态一致
    router.push('/login');
  }
};

const handlePermissionDeniedClose = () => {
  showPermissionDenied.value = false;
  router.go(-1);
};
</script>

<style scoped>
/* --- PC 端胶囊导航样式 --- */
.pc-nav-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 800;
  color: #64748b; /* slate-500 */
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.pc-nav-link:hover {
  color: #4f46e5; /* indigo-600 */
}

.pc-active {
  background-color: white;
  color: #4f46e5;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(226, 232, 240, 0.5); /* slate-200/50 */
}

/* --- 移动端黑色 Dock 样式 --- */
.dock-link {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 20px;
  border-radius: 20px;
  color: #94a3b8; /* slate-400 */
  transition: all 0.3s ease;
}

.dock-active {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.dock-divider {
  width: 1px;
  height: 24px;
  background-color: rgba(255, 255, 255, 0.1);
  margin: 0 4px;
}

/* --- 权限不足提示样式 --- */
.permission-denied {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

/* --- 页面过渡动画 --- */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: all 0.3s ease;
}
.page-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* --- 全局滚动条美化 (针对PC) --- */
:global(::-webkit-scrollbar) {
  width: 6px;
}
:global(::-webkit-scrollbar-track) {
  background: transparent;
}
:global(::-webkit-scrollbar-thumb) {
  background: #e2e8f0;
  border-radius: 10px;
}
:global(::-webkit-scrollbar-thumb:hover) {
  background: #cbd5e1;
}
</style>
