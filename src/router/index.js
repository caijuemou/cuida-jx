import { createRouter, createWebHistory } from 'vue-router'
import ScoringView from '../views/ScoringView.vue'
import AdminView from '../views/AdminView.vue'
import DashboardView from '../views/DashboardView.vue'
import Login from '../views/Login.vue'

const routes = [
  {
	path: '/Login',
	name: 'Login',
	component: Login,
	meta: {hideNav: true } // 👈 标记：登录页不显示导航栏
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
	path: "/admin/history",
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

// --- 全局路由守卫：保安逻辑 ---
router.beforeEach((to, from, next) => {
  const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
  const isAuthenticated = !!userInfo.name;

// 权限定义
  const isSuper = userInfo.name === '蔡珏侔' || userInfo.dept_name === '公司管理组';
  const isManager = userInfo.job_title?.includes('店经理') || userInfo.job_title?.includes('店长');

  if (to.path !== '/login' && !isAuthenticated) {
    next('/login'); // 没登录，滚去登录
  } 
  else if (to.path === '/admin' && !isSuper) {
    next('/'); // 不是超管想进管理页，弹回首页
  }
  else if (to.path === '/' && (!isSuper && !isManager)) {
    next('/dashboard'); // 既不是超管也不是店经理，不准打分，去大屏
  }
  else {
    next(); // 校验通过，放行
  }
});

export default router
