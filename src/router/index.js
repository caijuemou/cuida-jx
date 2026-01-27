import { createRouter, createWebHistory } from 'vue-router'
import ScoringView from '../views/ScoringView.vue'
import AdminView from '../views/AdminView.vue'
import DashboardView from '../views/DashboardView.vue'

const routes = [
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
