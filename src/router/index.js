import { createRouter, createWebHistory } from 'vue-router'
import ScoringView from '../views/ScoringView.vue'
import AdminView from '../views/AdminView.vue'
import DashboardView from '../views/DashboardView.vue'
import Login from '../views/Login.vue'

const routes = [
  {
    path: '/login', // 建议小写保持规范
    name: 'Login',
    component: Login,
    meta: { hideNav: true }
  },
  {
    path: '/',
    name: 'scoring',
    component: ScoringView
  },
  {
    path: '/admin',
    name: 'admin',
    component: AdminView
  },
  {
    path: "/dashboard",
    name: "dashboard",
    component: DashboardView
  },
  {
    // 修改：将路径从 /admin/history 简化为 /history
    path: "/history", 
    name: "history",
    component: () => import('../views/HistoryView.vue')
  },
  {
    path: '/admin/items',
    name: 'ItemsManagement',
    component: () => import('../views/ItemsManagement.vue')
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
  
  const isAuthenticated = !!(userInfo && userInfo.name);
  const urlParams = new URLSearchParams(window.location.search);
  const hasSsoData = urlParams.has('data'); // 检查 URL 是否带薪福通数据

  // 2. 权限角色判定
  const isSuper = userInfo?.name === '蔡珏侔' || userInfo?.dept_name?.includes('管理组');
  const isManager = userInfo?.job_title?.includes('店经理') || userInfo?.job_title?.includes('店长');
  const hasScoringAccess = isSuper || isManager;

  const targetPath = to.path.toLowerCase();

  // --- 逻辑拦截开始 ---

  // 情况 A: 未登录
  if (!isAuthenticated) {
    // 如果不在登录页，且 URL 也没带 SSO 数据，强制去登录页
    if (targetPath !== '/login' && !hasSsoData) {
      return next('/login');
    }
    // 如果去的是登录页，或者带了 SSO 数据（准备解析），放行
    return next();
  }

  // 情况 B: 已登录，但又想去登录页
  if (targetPath === '/login') {
    // 已经有身份了，直接根据权限送去首页或历史页
    return next(hasScoringAccess ? '/' : '/history');
  }

  // 情况 C: 路径权限校验
  // 1. 管理员页面校验
  if (targetPath.startsWith('/admin') && !isSuper) {
    return next(hasScoringAccess ? '/' : '/history');
  }

  // 2. 评分页面校验 (首页)
  if (targetPath === '/' && !hasScoringAccess) {
    return next('/history');
  }

  // 情况 D: 正常放行
  next();
});

export default router
