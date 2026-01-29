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

  // 1. 如果要去非登录页，且没登录，强制弹回登录页
  if (to.path !== '/login' && !isAuthenticated) {
    next('/login');
  } 
  // 2. 如果已经登录了还想回登录页，直接送去首页
  else if (to.path === '/login' && isAuthenticated) {
    next('/');
  } 
  // 3. 其他情况放行
  else {
    next();
  }
});

export default router
