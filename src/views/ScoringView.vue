<template>
  <div class="max-w-2xl mx-auto pb-32 px-4 space-y-8 text-base">
    <div v-if="canAccessScoring" class="flex justify-end">
      <router-link to="/history" class="flex items-center gap-2 px-4 py-2 bg-blue-100/80 rounded-2xl border border-slate-100 shadow-sm text-xs font-black text-slate-500 hover:text-indigo-600 transition-all">
        <HistoryIcon :size="16" />查看历史记录
      </router-link>
    </div>

    <section class="bg-white p-7 rounded-[2rem] shadow-sm border border-gray-100">
      <div class="flex justify-between items-center mb-5">
        <label class="text-xs font-black text-indigo-500 uppercase tracking-widest">1. 选择被考核人员</label>
        <button v-if="form.staff_id" @click="clearStaff" class="text-xs font-bold text-gray-400 hover:text-rose-500">重置</button>
      </div>

      <div v-if="!form.staff_id" class="relative group">
        <input v-model="searchStaffQuery" @input="handleStaffSearch" type="text" placeholder="输入姓名搜索 或 点击右侧图标..." 
          class="w-full pl-12 pr-14 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-indigo-100 focus:bg-white focus:ring-0 text-base font-bold transition-all" />
        <SearchIcon class="absolute left-4 top-4 text-gray-300" :size="20" />
        
        <button @click="openStaffPicker" type="button" class="absolute right-2 top-2 z-20 p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
          <LayersIcon :size="20" />
        </button>
        
        <div v-if="staffSearchResults.length > 0" class="absolute z-[70] w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div v-for="s in staffSearchResults" :key="s.xft_user_id" @click="selectStaff(s)" class="p-4 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-none">
            <div class="font-bold text-gray-800">{{ s.name }}</div>
            <div class="text-xs text-gray-400">{{ s.dept_name }} · {{ s.job_title }}</div>
          </div>
        </div>
      </div>

      <div v-else class="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center justify-between">
        <div class="flex items-center">
          <div class="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center mr-4 text-white shadow-lg"><UserIcon :size="20"/></div>
          <div>
            <div class="font-black text-indigo-900 text-base">{{ form.staff_name }}</div>
            <div class="text-xs text-indigo-400 font-bold">{{ form.store_name }}</div>
          </div>
        </div>
        <CheckCircleIcon class="text-indigo-500" :size="24" />
      </div>
    </section>

    <section class="bg-white p-7 rounded-[2rem] shadow-sm border border-gray-100 space-y-5">
      <div class="flex justify-between items-center">
        <label class="text-xs font-black uppercase tracking-widest flex items-center gap-2" :class="isManagerMode ? 'text-rose-500' : 'text-emerald-500'">
          2. 考核内容详情
          <span v-if="isManagerMode" class="bg-rose-500 text-white px-2 py-0.5 rounded-lg text-[10px] animate-pulse">店长专项</span>
        </label>
        <button v-if="form.item_id" @click="clearItem" class="text-xs font-bold text-gray-400 hover:text-rose-500">重置</button>
      </div>

      <div v-if="!form.item_id" class="relative">
        <input v-model="searchItemQuery" @input="handleItemSearch" type="text" placeholder="输入关键词搜索 或 点击右侧图标..." 
          class="w-full pl-12 pr-14 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-emerald-100 focus:bg-white focus:ring-0 text-base font-bold transition-all" />
        <SearchIcon class="absolute left-4 top-4 text-gray-300" :size="20" />
        
        <button @click="openItemPicker" type="button" class="absolute right-2 top-2 z-20 p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
          <LayoutGridIcon :size="20" />
        </button>
        
        <div v-if="itemSearchResults.length > 0" class="absolute z-[70] w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div v-for="i in itemSearchResults" :key="i.id" @click="selectItem(i)" class="p-4 hover:bg-emerald-50 cursor-pointer border-b border-gray-50 last:border-none">
            <div class="font-bold text-gray-800">{{ i.sub_category }}</div>
            <div class="text-xs text-emerald-500 font-bold">{{ i.category }} · {{ i.score_impact }}分</div>
          </div>
        </div>
      </div>

      <div v-else class="space-y-6 animate-in slide-in-from-top-2">
        <div class="p-6 bg-emerald-50 rounded-[1.5rem] border border-emerald-100">
          <div class="text-lg font-black text-emerald-900 leading-snug mb-4">{{ form.item_name }}</div>
          <div class="flex items-center justify-between pt-5 border-t border-emerald-100">
            <div class="flex flex-col">
              <span class="text-xs font-black text-rose-500 uppercase">实际扣分</span>
              <span class="text-[10px] text-gray-400 font-bold">标准分值: {{ standardScore }}分</span>
            </div>
            <div class="flex items-center bg-white rounded-2xl border-2 border-emerald-200 px-4 py-1 shadow-inner">
              <input v-model.number="form.score" type="number" class="w-16 py-2 bg-transparent border-none text-center font-black text-rose-600 text-2xl focus:ring-0" />
              <span class="text-gray-300 font-black ml-1 text-sm">分</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="bg-indigo-50/50 p-7 rounded-[2rem] border border-indigo-100/50">
      <button @click="submitScore" :disabled="!isReady || submitting" 
        class="w-full py-5 bg-indigo-600 rounded-3xl font-black text-lg text-white shadow-xl shadow-indigo-200 active:scale-95 transition-all disabled:bg-gray-200 disabled:shadow-none">
        {{ submitting ? '处理中...' : '确认并提交记录' }}
      </button>
    </section>

    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router' // 引入路由
import { supabase } from '../composables/useSupabase'
import { 
  SearchIcon, UserIcon, XIcon, ChevronRightIcon, 
  ChevronLeftIcon, CheckCircleIcon, LayersIcon, 
  HistoryIcon, LayoutGridIcon 
} from 'lucide-vue-next'

const router = useRouter()
const userInfo = ref(JSON.parse(localStorage.getItem('user_info') || '{}'))

// --- 权限逻辑 ---
const isSuperAdmin = computed(() => {
  return userInfo.value.dept_name?.includes('管理组') || userInfo.value.name === '蔡珏侔'
})

const canAccessScoring = computed(() => {
  const job = userInfo.value.job_title || ''
  return isSuperAdmin.value || job.includes('店经理') || job.includes('店长')
})

// --- 1. 状态定义 ---
const form = ref({ 
  staff_id: '', staff_name: '', store_name: '', 
  date: new Date().toISOString().split('T')[0], 
  item_id: '', item_name: '', category_name: '', score: 0 
})

const allItems = ref([])
const staffTree = ref({})
const submitting = ref(false)
const searchStaffQuery = ref('')
const staffSearchResults = ref([])
const searchItemQuery = ref('')
const itemSearchResults = ref([])
const isManagerMode = ref(false)
const pickerMode = ref(null) 
const staffStep = ref(1) 
const currentRegion = ref('') 
const currentDistrict = ref('') 
const currentDept = ref('')
const itemStep = ref(1) 
const currentCategory = ref('') 
const standardScore = ref(0)

// --- 2. 加载数据 ---
const loadData = async () => {
  // 核心安全检查：如果普通员工误入，直接踢到历史页
  if (!canAccessScoring.value) {
    router.push('/history')
    return
  }

  try {
    const [staffRes, deptRes, itemsRes] = await Promise.all([
      supabase.from('staff_cache').select('*').eq('is_active', true),
      supabase.from('dept_cache').select('*'),
      supabase.from('scoring_items').select('*').eq('is_active', true)
    ])

    const myVNumber = userInfo.value.xft_user_id
    const myInfo = staffRes.data?.find(s => s.xft_user_id === myVNumber)
    const isStoreManager = myInfo?.job_title?.includes('店长') || myInfo?.job_title?.includes('店经理')
    const myDept = myInfo?.dept_name
    const isRestrictedManager = isStoreManager && myDept !== '公司管理组'

    const tree = {}
    staffRes.data?.forEach(s => {
      if (isRestrictedManager && s.dept_name !== myDept) return
      const deptInfo = deptRes.data?.find(d => d.name === s.dept_name)
      const pathParts = deptInfo?.name_path?.split('/') || []
      
      let region, district, store
      if (isRestrictedManager) {
        region = '本门店'; district = myDept; store = s.dept_name
      } else if (pathParts.length <= 2) {
        region = '总部/职能部门'; district = s.dept_name; store = s.dept_name
      } else {
        region = pathParts[1] || '其他区域'; district = pathParts[2] || '其他网点'; store = s.dept_name
      }

      if (!tree[region]) tree[region] = {}
      if (!tree[region][district]) tree[region][district] = {}
      if (!tree[region][district][store]) tree[region][district][store] = []
      tree[region][district][store].push(s)
    })

    staffTree.value = tree
    allItems.value = itemsRes.data || []
  } catch (err) {
    console.error("加载失败:", err)
  }
}

// --- 剩下的交互逻辑保持不变 (selectStaff, submitScore, handleStaffSearch 等) ---
// ... 

onMounted(loadData)
</script>
