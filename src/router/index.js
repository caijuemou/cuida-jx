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
  const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
  const isAuthenticated = !!userInfo.name;

  // 权限判定
  const isSuper = userInfo.name === '蔡珏侔' || (userInfo.dept_name && userInfo.dept_name.includes('管理组'));
  const isManager = userInfo.job_title?.includes('店经理') || userInfo.job_title?.includes('店长');
  const hasScoringAccess = isSuper || isManager;

  // 1. 未登录处理
  if (to.path.toLowerCase() !== '/login' && !isAuthenticated) {
    return next('/login');
  }

  // 2. 已登录但去登录页
  if (to.path.toLowerCase() === '/login' && isAuthenticated) {
    return next(hasScoringAccess ? '/' : '/history');
  }

  // 3. 管理员权限校验 (针对 /admin 及其子路由)
  if (to.path.startsWith('/admin') && !isSuper) {
    return next('/'); 
  }

  // 4. 评分权限校验 (针对 /)
  // 如果员工强行访问评分页，将其重定向到历史页
  if (to.path === '/' && !hasScoringAccess) {
    return next('/history');
  }

  // 5. 放行
  next();
});

export default router
