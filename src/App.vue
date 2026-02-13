<template>
  <div class="min-h-screen bg-[#F8FAFC] font-sans antialiased text-slate-900">
    
    <header v-if="!route.meta.hideNav && userInfo.name" 
            class="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100">
      <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl shadow-inner overflow-hidden border border-slate-100 bg-white">
            <img src="/logo.jpg" alt="Logo" class="w-full h-full object-cover" />
          </div>
          <div class="flex flex-col">
            <span class="text-sm font-black tracking-tight leading-none uppercase">CUìDA</span>
            <span class="text-[10px] text-indigo-500 font-bold uppercase tracking-widest leading-none mt-1">Performance</span>
          </div>
        </div>

        <nav class="hidden md:flex items-center bg-slate-100/50 p-1 rounded-2xl border border-slate-200/50">
          <router-link v-if="canAccessScoring" to="/" class="pc-nav-link" active-class="pc-active">
            <PenToolIcon :size="16" /> 绩效评分
          </router-link>
          
          <router-link to="/dashboard" class="pc-nav-link" active-class="pc-active">
            <LayoutDashboardIcon :size="16" /> 考核大屏
          </router-link>

          <router-link v-if="!canAccessScoring" to="/history" class="pc-nav-link" active-class="pc-active">
            <ClipboardListIcon :size="16" /> 评分历史
          </router-link>

          <router-link v-if="isSuperAdmin" to="/admin" class="pc-nav-link" active-class="pc-active">
            <SettingsIcon :size="16" /> 系统管理
          </router-link>
        </nav>

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

    <nav v-if="!route.meta.hideNav && userInfo.name" 
         class="md:hidden fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-4 w-full max-w-fit">
      <div class="bg-slate-900/90 backdrop-blur-2xl p-2 rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border border-white/10 flex items-center gap-1">
        
        <router-link v-if="canAccessScoring" to="/" class="dock-link" active-class="dock-active">
          <PenToolIcon :size="20" />
        </router-link>

        <div v-if="canAccessScoring" class="dock-divider"></div>

        <template v-if="!canAccessScoring">
          <router-link to="/history" class="dock-link" active-class="dock-active">
            <ClipboardListIcon :size="20" />
          </router-link>
          <div class="dock-divider"></div>
        </template>

        <router-link to="/dashboard" class="dock-link" active-class="dock-active">
          <LayoutDashboardIcon :size="20" />
        </router-link>

        <template v-if="isSuperAdmin">
          <div class="dock-divider"></div>
          <router-link to="/admin" class="dock-link" active-class="dock-active">
            <SettingsIcon :size="20" />
          </router-link>
        </template>
      </div>
    </nav>

    <main :class="{ 'max-w-7xl mx-auto pt-6 px-4 pb-32 md:pb-12': !route.meta.hideNav }">
      <router-view v-slot="{ Component }">
        <transition name="page-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { 
  LogOutIcon, PenToolIcon, LayoutDashboardIcon, 
  SettingsIcon, ClipboardListIcon 
} from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const userInfo = ref({});

/**
 * 解析薪福通 URL 中的 data 参数
 * 格式通常为 Base64 后的 key1=val1|key2=val2...
 */
const parseXftParams = (dataStr) => {
  try {
    // 1. Base64 解码
    const decoded = atob(dataStr);
    // 2. 按 | 分割成数组，再转成对象
    const params = {};
    decoded.split('|').forEach(item => {
      const [key, val] = item.split('=');
      if (key) params[key] = val;
    });
    return params;
  } catch (e) {
    console.error('解析薪福通参数失败:', e);
    return null;
  }
};

// 核心：刷新/同步用户信息
const refreshUser = () => {
  // 1. 尝试从 URL 获取单点登录参数
  const urlParams = new URLSearchParams(window.location.search);
  const xftData = urlParams.get('data');

  if (xftData) {
    const params = parseXftParams(xftData);
    if (params && params.USRNBR) {
      // 构造标准用户信息对象 (映射关系根据你之前的代码确定)
      const ssoUser = {
        name: params.USRNAME || '未知用户',
        xft_user_id: params.USRNBR, // V007E 这种工号
        dept_name: '同步中...', // 部门信息通常需要进系统后二次查询或从其他参数解析
        job_title: '员工'       // 默认值，后续可由业务逻辑更新
      };
      
      // 存入本地，实现静默登录
      localStorage.setItem('user_info', JSON.stringify(ssoUser));
      userInfo.value = ssoUser;

      // 关键步骤：清理 URL 上的长参数，保持地址栏干净
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      
      console.log('✅ 薪福通静默登录成功:', ssoUser.name);
      return;
    }
  }

  // 2. 如果 URL 没参数，走常规缓存读取
  const localData = localStorage.getItem('user_info');
  if (localData) {
    try {
      userInfo.value = JSON.parse(localData);
      return; // 已登录，正常继续
    } catch (e) {
      localStorage.removeItem('user_info');
    }
  }

  // 3. 【关键：强制跳转逻辑】
  // 如果执行到这里，说明：URL没参数 且 本地没缓存 -> 视为“未登录”
  // 如果当前不在登录页，且不是在排除页面，则强制跳转
  if (!route.meta.hideNav) {
    console.log('未检测到登录状态，正在引导至登录...');
    
    // 如果你希望直接跳到薪福通官方登录页（即你那个长链接的来源），直接 window.location.href
    // 如果你有一个自己的 LoginView.vue，则 router.push('/login')
    router.push('/login'); 
  }
};

onMounted(refreshUser);
watch(() => route.path, refreshUser);

// --- 权限判定 ---
const isSuperAdmin = computed(() => {
  const dept = userInfo.value.dept_name || '';
  return dept.includes('管理组') || userInfo.value.name === '蔡珏侔';
});

const canAccessScoring = computed(() => {
  const job = userInfo.value.job_title || '';
  return isSuperAdmin.value || job.includes('店经理') || job.includes('店长');
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
