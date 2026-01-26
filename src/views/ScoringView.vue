<template>
  <div class="max-w-2xl mx-auto pb-24 px-4">
    <div class="mb-8 p-6 bg-gradient-to-br from-indigo-700 to-blue-800 rounded-3xl text-white shadow-xl relative overflow-hidden">
      <div class="relative z-10">
        <h2 class="text-2xl font-extrabold tracking-tight">绩效打分工作台</h2>
        <p class="text-blue-100 text-sm mt-1 opacity-90">录入分值将直接计入扣分统计</p>
      </div>
      <div class="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
    </div>

    <div class="mb-8 space-y-3">
      <div class="group relative">
        <div class="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 transition-all group-focus-within:shadow-indigo-100 group-focus-within:border-indigo-200">
          <div class="relative">
            <input
              v-model="searchStaffQuery"
              @input="debouncedSearchStaff"
              type="text"
              placeholder="搜索员工姓名或工号..."
              class="w-full pl-12 pr-4 py-4 bg-transparent text-gray-700 placeholder-gray-400 outline-none font-medium"
            />
            <div class="absolute left-4 top-4 text-indigo-500">
              <SearchIcon :size="20" />
            </div>
          </div>
        </div>

        <div v-if="staffSearchResults.length > 0 && !selectedStaff"
             class="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-50 overflow-hidden divide-y divide-gray-50">
          <div
            v-for="staff in staffSearchResults"
            :key="staff.xft_user_id"
            @click="selectStaff(staff)"
            class="p-4 cursor-pointer hover:bg-indigo-50 transition-colors flex items-center"
          >
            <div class="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold mr-3">
              {{ staff.name.charAt(0) }}
            </div>
            <div>
              <div class="font-bold text-gray-800">{{ staff.name }}</div>
              <div class="text-xs text-gray-400">{{ staff.dept_name }} · {{ staff.job_title }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <div class="flex-1 h-[1px] bg-gray-100"></div>
        <span class="text-[10px] text-gray-300 font-bold tracking-widest uppercase">或者按层级选择</span>
        <div class="flex-1 h-[1px] bg-gray-100"></div>
      </div>

      <div class="relative">
        <button 
          @click="showCascader = !showCascader"
          class="w-full bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between text-gray-600 hover:border-indigo-300 transition-all"
        >
          <div class="flex items-center gap-2">
            <LayersIcon :size="18" class="text-indigo-500" />
            <span class="font-bold text-sm">{{ cascadeLabel || '点击按区域/门店筛选' }}</span>
          </div>
          <ChevronRightIcon :size="18" :class="{'rotate-90': showCascader}" class="transition-transform" />
        </button>

        <Transition name="fade">
          <div v-if="showCascader" class="absolute z-40 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-50 p-4 max-h-80 overflow-y-auto">
            <div v-if="loadingTree" class="py-10 text-center text-gray-300 text-xs animate-pulse">正在生成层级树...</div>
            <div v-else class="space-y-4">
              <div v-for="(region, rKey) in staffTree" :key="rKey">
                <div class="text-[10px] font-black text-indigo-400 uppercase mb-2 ml-1">{{ rKey }}</div>
                <div class="grid grid-cols-2 gap-2">
                  <button 
                    v-for="(dept, dKey) in region" :key="dKey"
                    @click="handleDeptClick(dept, dKey)"
                    class="text-left p-3 rounded-xl bg-gray-50 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-all"
                  >
                    <div class="font-bold text-gray-700 text-sm">{{ dKey }}</div>
                    <div class="text-[10px] text-gray-400">{{ dept.length }} 名员工</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <Transition name="fade">
      <div v-if="selectedStaff" class="mb-8 p-4 bg-indigo-600 rounded-3xl flex items-center justify-between shadow-lg shadow-indigo-200">
        <div class="flex items-center">
          <div class="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white mr-4">
            <UserIcon :size="24" />
          </div>
          <div>
            <div class="text-[10px] text-indigo-200 font-black uppercase tracking-widest">当前考评对象</div>
            <div class="text-lg font-black text-white">{{ selectedStaff.name }}</div>
            <div class="text-[10px] text-indigo-100 opacity-70">{{ selectedStaff.dept_name }} · {{ selectedStaff.job_title }}</div>
          </div>
        </div>
        <button @click="clearSelectedStaff" class="p-2 hover:bg-white/10 rounded-xl text-white transition-colors">
          <XIcon :size="20" />
        </button>
      </div>
    </Transition>

    <div v-if="loadingItems" class="py-20 text-center text-gray-400 font-bold italic animate-pulse">
      正在加载考核指标...
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="item in items"
        :key="item.id"
        class="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center transition-all hover:shadow-md"
      >
        <div class="flex-1 mb-4 md:mb-0 pr-4">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full uppercase">{{ item.category }}</span>
          </div>
          <div class="text-gray-900 font-black text-lg leading-tight">{{ item.sub_category }}</div>
          <div class="text-sm text-gray-400 mt-2 line-clamp-2">{{ item.description || '无详细描述' }}</div>
          <div class="mt-3 flex items-center text-xs font-bold text-gray-300 uppercase tracking-tighter">
            <InfoIcon :size="14" class="mr-1" /> 扣分上限参考: {{ item.score_impact }} 分
          </div>
        </div>

        <div class="flex items-center gap-3 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0">
          <div
            class="flex-1 md:flex-none flex items-center bg-gray-50 rounded-2xl px-4 border-2 transition-all"
            :class="item.temp_input > item.score_impact ? 'border-orange-400 bg-orange-50' : 'border-transparent focus-within:border-indigo-500'"
          >
            <input
              type="number"
              v-model.number="item.temp_input"
              :placeholder="item.score_impact"
              class="w-16 bg-transparent border-none focus:ring-0 text-center font-black text-gray-800 py-3"
            />
            <span class="text-gray-400 text-xs font-bold ml-1">分</span>
          </div>

          <button
            @click="submitScore(item)"
            :disabled="!selectedStaff || !item.temp_input"
            class="bg-indigo-600 text-white px-6 py-3.5 rounded-2xl text-xs font-black shadow-xl shadow-indigo-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none transition-all active:scale-95"
          >
            提交扣分
          </button>         
        </div>
      </div>
    </div>

    <div v-if="tempStaffList.length > 0" class="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end">
        <div class="bg-white w-full rounded-t-[40px] p-8 max-h-[70vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl font-black text-gray-900">{{ currentDeptName }} 员工名单</h3>
                <button @click="tempStaffList = []" class="p-2 bg-gray-100 rounded-full"><XIcon :size="20"/></button>
            </div>
            <div class="grid grid-cols-1 gap-3">
                <div v-for="s in tempStaffList" :key="s.xft_user_id" 
                    @click="selectStaffFromList(s)"
                    class="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-indigo-600 hover:text-white group transition-all"
                >
                    <span class="font-bold">{{ s.name }}</span>
                    <span class="text-xs opacity-50">{{ s.job_title }}</span>
                </div>
            </div>
        </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../composables/useSupabase'
import { SearchIcon, UserIcon, XIcon, InfoIcon, LayersIcon, ChevronRightIcon } from 'lucide-vue-next'

const searchStaffQuery = ref('')
const selectedStaff = ref(null)
const staffSearchResults = ref([])
const items = ref([])
const loadingItems = ref(false)

// --- 层级树相关变量 ---
const showCascader = ref(false)
const staffTree = ref({})
const loadingTree = ref(false)
const cascadeLabel = ref('')
const tempStaffList = ref([])
const currentDeptName = ref('')

// --- 模拟区域划分逻辑 (你可以根据实际情况调整) ---
const getRegionByDept = (deptName) => {
  if (deptName.includes('店')) {
    if (['湾悦城店', '大悦城店', '湖里店'].includes(deptName)) return '厦门区域'
    if (['福州店'].includes(deptName)) return '福州区域'
    return '其他区域'
  }
  return '职能部门'
}

// --- 构建层级树 ---
const buildStaffTree = async () => {
  loadingTree.value = true
  const { data } = await supabase.from('staff_cache').select('*')
  
  const tree = {}
  data.forEach(staff => {
    const region = getRegionByDept(staff.dept_name)
    if (!tree[region]) tree[region] = {}
    if (!tree[region][staff.dept_name]) tree[region][staff.dept_name] = []
    tree[region][staff.dept_name].push(staff)
  })
  staffTree.value = tree
  loadingTree.value = false
}

const handleDeptClick = (staffs, deptName) => {
  currentDeptName.value = deptName
  tempStaffList.value = staffs
}

const selectStaffFromList = (staff) => {
  selectStaff(staff)
  tempStaffList.value = []
  showCascader.value = false
  cascadeLabel.value = `${getRegionByDept(staff.dept_name)} / ${staff.dept_name}`
}

// --- 原有搜索逻辑 ---
let debounceTimeout = null
const debouncedSearchStaff = () => {
  clearTimeout(debounceTimeout)
  if (searchStaffQuery.value.length < 2) {
    staffSearchResults.value = []
    return
  }
  debounceTimeout = setTimeout(async () => {
    const { data } = await supabase
      .from('staff_cache')
      .select('*')
      .or(`name.ilike.%${searchStaffQuery.value}%,xft_user_id.ilike.%${searchStaffQuery.value}%`)
      .limit(5)
    staffSearchResults.value = data || []
  }, 300)
}

const selectStaff = (staff) => {
  selectedStaff.value = staff
  searchStaffQuery.value = staff.name
  staffSearchResults.value = []
  cascadeLabel.value = ''
}

const clearSelectedStaff = () => {
  selectedStaff.value = null
  searchStaffQuery.value = ''
  cascadeLabel.value = ''
}

const fetchItems = async () => {
  loadingItems.value = true
  const { data } = await supabase.from('scoring_items').select('*').order('category')
  items.value = (data || []).map(i => ({ ...i, temp_input: null }))
  loadingItems.value = false
}

const submitScore = async (item) => {
  if (!selectedStaff.value || !item.temp_input) return
  if (item.temp_input > item.score_impact) {
    const proceed = confirm(`该项设定上限为 ${item.score_impact} 分，确认按 ${item.temp_input} 分扣除吗？`)
    if (!proceed) return
  }

  try {
    const { error } = await supabase.from('performance_logs').insert({
      staff_id: selectedStaff.value.xft_user_id,
      item_id: item.id,
      final_score: Math.abs(item.temp_input),
      operator_name: '管理员',
      sync_status: 'pending'
    })
    if (error) throw error
    alert(`已记录：${selectedStaff.value.name} 扣除 ${item.temp_input} 分`)
    item.temp_input = null
  } catch (err) {
    alert('提交失败，请检查网络')
  }
}

onMounted(() => {
  fetchItems()
  buildStaffTree()
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
input[type=number] { -moz-appearance: textfield; }
</style>
