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

export default router
