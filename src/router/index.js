import { createRouter, createWebHistory } from 'vue-router'
import ScoringView from '../views/ScoringView.vue'
import AdminView from '../views/AdminView.vue'
import DashboardView from '../views/DashboardView.vue'
import Login from '../views/Login.vue'
import {
  canAccessScoring,
  isSuperAdmin,
  isValidUser,
  getUserRole
} from '../utils/permissions'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: {
      hideNav: true,
      requiresAuth: false
    }
  },
  {
    path: '/',
    name: 'scoring',
    component: ScoringView,
    meta: {
      requiresAuth: true,
      requiresScoring: true
    }
  },
  {
    path: '/admin',
    name: 'admin',
    component: AdminView,
    meta: {
      requiresAuth: true,
      requiresAdmin: true
    }
  },
  {
    path: "/dashboard",
    name: "dashboard",
    component: DashboardView,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: "/history",
    name: "history",
    component: () => import('../views/HistoryView.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/admin/items',
    name: 'ItemsManagement',
    component: () => import('../views/ItemsManagement.vue'),
    meta: {
      requiresAuth: true,
      requiresAdmin: true
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// --- 全局路由守卫 ---
router.beforeEach((to, from, next) => {
  // 1. 获取登录状态
  const localData = localStorage.getItem('user_info');
  let userInfo = null;
  try {
    userInfo = localData ? JSON.parse(localData) : null;
  } catch (e) {
    userInfo = null;
  }

  console.log('[Router Guard] 读取到的用户信息:', userInfo);
  console.log('[Router Guard] isValidUser 结果:', isValidUser(userInfo));
  
  const isAuthenticated = isValidUser(userInfo);
  const urlParams = new URLSearchParams(window.location.search);
  const hasSsoData = urlParams.has('data'); // 检查 URL 是否带薪福通数据

  // 2. 使用统一的权限工具函数
  const userIsSuper = isSuperAdmin(userInfo);
  const userHasScoringAccess = canAccessScoring(userInfo);
  const userRole = getUserRole(userInfo);

  const targetPath = to.path.toLowerCase();

  // --- 详细日志记录 (便于调试) ---
  console.log(`[Router Guard] Path: ${targetPath}, Authenticated: ${isAuthenticated}, Role: ${userRole}`);

  // --- 逻辑拦截开始 ---

  // 情况 A: 未登录
  if (!isAuthenticated) {
    // 如果有 SSO 数据，强制重定向到登录页进行解析
    if (hasSsoData) {
      console.log('[Router Guard] 检测到 SSO 数据，重定向到登录页进行解析');
      return next('/login');
    }
    // 如果没有 SSO 数据，且不在登录页，强制去登录页
    if (targetPath !== '/login') {
      console.log('[Router Guard] 未登录，重定向到登录页');
      return next('/login');
    }
    // 如果去的是登录页，放行
    console.log('[Router Guard] 未登录但访问登录页，放行');
    return next();
  }

  // 情况 B: 已登录，但又想去登录页
  if (targetPath === '/login') {
    // 已经有身份了，直接根据权限送去首页或历史页
    const redirectPath = userHasScoringAccess ? '/' : '/history';
    console.log(`[Router Guard] 已登录访问登录页，重定向到 ${redirectPath}`);
    return next(redirectPath);
  }

  // 情况 C: 检查路由元信息中的权限要求
  if (to.meta.requiresAuth && !isAuthenticated) {
    console.log('[Router Guard] 需要登录但未登录，重定向到登录页');
    return next('/login');
  }

  // 情况 D: 路径权限校验
  // 1. 管理员页面校验
  if (to.meta.requiresAdmin && !userIsSuper) {
    console.log('[Router Guard] 需要管理员权限但用户不是管理员，重定向到首页或历史页');
    return next(userHasScoringAccess ? '/' : '/history');
  }

  // 2. 评分页面校验 (首页)
  if (to.meta.requiresScoring && !userHasScoringAccess) {
    console.log('[Router Guard] 需要评分权限但用户无权限，重定向到历史页');
    return next('/history');
  }

  // 情况 E: 正常放行
  console.log('[Router Guard] 权限检查通过，放行');
  next();
});

export default router
