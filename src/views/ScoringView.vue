<template>
  <div class="max-w-2xl mx-auto pb-32 px-4 space-y-8 text-base">
    
    <section class="bg-white p-7 rounded-[2rem] shadow-sm border border-gray-100">
      <div class="flex justify-between items-center mb-5">
        <label class="text-xs font-black text-indigo-500 uppercase tracking-widest">1. 选择考核对象</label>
        <button v-if="form.staff_id" @click="clearStaff" class="text-xs font-bold text-gray-400 hover:text-rose-500">重置</button>
      </div>

      <div class="relative mb-4">
        <input v-model="searchStaffQuery" @input="handleStaffSearch" type="text" placeholder="输入姓名或工号搜索..." 
          class="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 text-base font-bold" />
        <SearchIcon class="absolute left-4 top-4 text-gray-300" :size="20" />
        
        <div v-if="staffSearchResults.length > 0" class="absolute z-[70] w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          <div v-for="s in staffSearchResults" :key="s.xft_user_id" @click="selectStaff(s)" class="p-4 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-none">
            <div class="font-bold text-gray-800">{{ s.name }}</div>
            <div class="text-xs text-gray-400">{{ s.dept_name }} · {{ s.job_title }}</div>
          </div>
        </div>
      </div>

      <div v-if="!form.staff_id">
        <button @click="openStaffPicker" class="w-full py-4 px-5 bg-gray-50 rounded-2xl text-left flex justify-between items-center group border border-transparent hover:border-indigo-100 transition-all">
          <span class="text-base font-bold text-gray-500 group-hover:text-indigo-600">从组织架构三级级联选择...</span>
          <ChevronRightIcon :size="20" class="text-gray-300" />
        </button>
      </div>

      <div v-else class="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center justify-between animate-in fade-in zoom-in duration-300">
        <div class="flex items-center">
          <div class="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center mr-4 text-white shadow-lg shadow-indigo-200"><UserIcon :size="20"/></div>
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
        <label class="text-xs font-black text-emerald-500 uppercase tracking-widest">2. 考核内容详情</label>
        <button v-if="form.item_id" @click="clearItem" class="text-xs font-bold text-gray-400 hover:text-rose-500">重置</button>
      </div>

      <div class="relative mb-2">
        <input v-model="searchItemQuery" @input="handleItemSearch" type="text" placeholder="输入关键词搜索考核标准..." 
          class="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 text-base font-bold" />
        <SearchIcon class="absolute left-4 top-4 text-gray-300" :size="20" />
        
        <div v-if="itemSearchResults.length > 0" class="absolute z-[70] w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          <div v-for="i in itemSearchResults" :key="i.id" @click="selectItem(i)" class="p-4 hover:bg-emerald-50 cursor-pointer border-b border-gray-50 last:border-none">
            <div class="font-bold text-gray-800">{{ i.sub_category }}</div>
            <div class="text-xs text-emerald-500 font-bold">{{ i.category }} · {{ i.score_impact }}分</div>
          </div>
        </div>
      </div>

      <div v-if="!form.item_id">
        <button @click="openItemPicker" class="w-full py-4 px-5 bg-gray-50 rounded-2xl text-left flex justify-between items-center group border border-transparent hover:border-emerald-100 transition-all">
          <span class="text-base font-bold text-gray-500 group-hover:text-emerald-600">按考核分类级联选择...</span>
          <LayersIcon :size="20" class="text-gray-300" />
        </button>
      </div>

      <div v-else class="space-y-6 animate-in slide-in-from-top-4 duration-300">
        <div class="p-6 bg-emerald-50 rounded-[1.5rem] border border-emerald-100">
          <div class="text-lg font-black text-emerald-900 leading-snug mb-4">{{ form.item_name }}</div>
          <div class="flex items-center justify-between pt-5 border-t border-emerald-100">
            <div class="flex flex-col">
              <span class="text-xs font-black text-rose-500 uppercase">实际扣分</span>
              <span class="text-[10px] text-gray-400 font-bold tracking-tight">标准最高扣分: {{ standardScore }}分</span>
            </div>
            <div class="flex items-center bg-white rounded-2xl border-2 border-emerald-200 px-4 py-1 shadow-sm">
              <input v-model.number="form.score" type="number" class="w-16 py-2 bg-transparent border-none text-center font-black text-rose-600 text-2xl focus:ring-0" />
              <span class="text-gray-300 font-black ml-1 text-sm">分</span>
            </div>
          </div>
        </div>
        <div class="px-2">
          <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">考核执行日期</label>
          <input v-model="form.date" type="date" class="w-full p-4 bg-gray-50 rounded-2xl border-none text-base font-bold text-gray-600 focus:ring-2 focus:ring-emerald-500" />
        </div>
      </div>
    </section>

    <section class="bg-indigo-50/50 p-7 rounded-[2rem] border border-indigo-100/50">
      <div class="flex justify-between items-center mb-8 px-2">
        <div>
          <div class="text-[10px] text-indigo-400 font-black tracking-widest uppercase mb-1">Operator Info</div>
          <div class="text-base font-black text-indigo-900">{{ form.operator_name }} <span class="text-indigo-200 mx-1">|</span> {{ form.operator_dept }}</div>
        </div>
        <div class="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-200 shadow-sm"><FileTextIcon :size="24" /></div>
      </div>
      <button @click="submitScore" :disabled="!isReady || submitting" 
        class="w-full py-5 bg-indigo-600 rounded-3xl font-black text-lg text-white shadow-xl shadow-indigo-900/20 active:scale-[0.98] transition-all disabled:bg-gray-200 disabled:text-gray-400">
        {{ submitting ? '正在加密传输...' : '提交扣分记录单' }}
      </button>
    </section>

    <div v-if="pickerMode" class="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end">
      <div class="bg-white w-full rounded-t-[3rem] p-8 max-h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
        
        <div class="flex justify-between items-center mb-6">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <button v-if="(pickerMode === 'staff' && staffStep > 1) || (pickerMode === 'item' && itemStep > 1)" 
                @click="goBack" class="px-3 py-1 bg-gray-100 rounded-lg text-xs font-black text-gray-500 hover:bg-indigo-600 hover:text-white transition-all">← 返回上级</button>
              <h3 class="text-2xl font-black text-gray-900">{{ currentPickerTitle }}</h3>
            </div>
          </div>
          <button @click="closePicker" class="p-3 bg-gray-100 rounded-2xl"><XIcon :size="20"/></button>
        </div>

        <div class="flex-1 overflow-y-auto space-y-3 pb-12">
          <template v-if="pickerMode === 'staff'">
            <button v-for="item in currentStaffOptions" :key="item" @click="handleStaffStepClick(item)"
              class="w-full p-5 bg-gray-50 rounded-2xl text-left font-black text-gray-700 hover:bg-indigo-50 flex justify-between items-center transition-all group">
              <span>{{ item.name || item }}</span>
              <ChevronRightIcon :size="20" class="text-gray-300 group-hover:text-indigo-400 transition-colors" />
            </button>
          </template>

          <template v-if="pickerMode === 'item'">
            <button v-for="item in currentItemOptions" :key="item.id || item" @click="handleItemStepClick(item)"
              class="w-full p-5 bg-gray-50 rounded-2xl text-left font-black text-gray-700 hover:bg-emerald-50 flex justify-between items-center transition-all group">
              <div class="flex flex-col">
                <span>{{ item.sub_category || item }}</span>
                <span v-if="item.score_impact" class="text-[10px] text-emerald-500 mt-1">标准扣分: {{ item.score_impact }}分</span>
              </div>
              <ChevronRightIcon :size="20" class="text-gray-300 group-hover:text-emerald-400" />
            </button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../composables/useSupabase'
import { SearchIcon, UserIcon, XIcon, ChevronRightIcon, FileTextIcon, CheckCircleIcon, LayersIcon } from 'lucide-vue-next'

// --- 基础状态 ---
const form = ref({ staff_id: '', staff_name: '', store_name: '', date: new Date().toISOString().split('T')[0], item_id: '', item_name: '', score: 0, operator_name: '管理员', operator_dept: '运营部' })
const allItems = ref([]); const staffTree = ref({}); const submitting = ref(false)

// --- 搜索状态 ---
const searchStaffQuery = ref(''); const staffSearchResults = ref([])
const searchItemQuery = ref(''); const itemSearchResults = ref([])

// --- 级联器控制 ---
const pickerMode = ref(null); // 'staff' | 'item'
const staffStep = ref(1); const currentRegion = ref(''); const currentDept = ref('')
const itemStep = ref(1); const currentCategory = ref('')
const standardScore = ref(0)

// --- 数据初始化 ---
const loadData = async () => {
  const [staffRes, deptRes, itemsRes] = await Promise.all([
    supabase.from('staff_cache').select('*').eq('is_active', true),
    supabase.from('dept_cache').select('*'),
    supabase.from('scoring_items').select('*').eq('is_active', true)
  ])
  const tree = {}
  staffRes.data?.forEach(s => {
    const deptInfo = deptRes.data?.find(d => d.name === s.dept_name)
    const region = deptInfo?.name_path?.split('/')[1] || '其他区域'
    if (!tree[region]) tree[region] = {}
    if (!tree[region][s.dept_name]) tree[region][s.dept_name] = []
    tree[region][s.dept_name].push(s)
  })
  staffTree.value = tree
  allItems.value = itemsRes.data || []
}

// --- 搜索逻辑 ---
const handleStaffSearch = async () => {
  if (searchStaffQuery.value.length < 1) return staffSearchResults.value = []
  const { data } = await supabase.from('staff_cache').select('*').eq('is_active', true)
    .or(`name.ilike.%${searchStaffQuery.value}%,xft_user_id.ilike.%${searchStaffQuery.value}%`).limit(10)
  staffSearchResults.value = data || []
}

const handleItemSearch = () => {
  if (searchItemQuery.value.length < 1) return itemSearchResults.value = []
  itemSearchResults.value = allItems.value.filter(i => i.sub_category.includes(searchItemQuery.value) || i.category.includes(searchItemQuery.value)).slice(0, 8)
}

// --- 级联器控制逻辑 ---
const currentPickerTitle = computed(() => {
  if (pickerMode.value === 'staff') return ['选择所属区域', '选择具体门店', '确认扣分员工'][staffStep.value - 1]
  return ['选择指标分类', '点选具体项'][itemStep.value - 1]
})

const currentStaffOptions = computed(() => {
  if (staffStep.value === 1) return Object.keys(staffTree.value)
  if (staffStep.value === 2) return Object.keys(staffTree.value[currentRegion.value] || {})
  return staffTree.value[currentRegion.value]?.[currentDept.value] || []
})

const currentItemOptions = computed(() => {
  if (itemStep.value === 1) return [...new Set(allItems.value.map(i => i.category))]
  return allItems.value.filter(i => i.category === currentCategory.value)
})

const handleStaffStepClick = (val) => {
  if (staffStep.value === 1) { currentRegion.value = val; staffStep.value = 2 }
  else if (staffStep.value === 2) { currentDept.value = val; staffStep.value = 3 }
  else { selectStaff(val) }
}

const handleItemStepClick = (val) => {
  if (itemStep.value === 1) { currentCategory.value = val; itemStep.value = 2 }
  else { selectItem(val) }
}

const goBack = () => {
  if (pickerMode.value === 'staff') staffStep.value--
  else itemStep.value--
}

// --- 选中与重置 ---
const selectStaff = (s) => {
  form.value.staff_id = s.xft_user_id; form.value.staff_name = s.name; form.value.store_name = s.dept_name
  staffSearchResults.value = []; searchStaffQuery.value = ''; closePicker()
}

const selectItem = (i) => {
  form.value.item_id = i.id; form.value.item_name = i.sub_category; form.value.score = i.score_impact; standardScore.value = i.score_impact
  currentCategory.value = i.category; itemSearchResults.value = []; searchItemQuery.value = ''; closePicker()
}

const openStaffPicker = () => { pickerMode.value = 'staff'; staffStep.value = 1 }
const openItemPicker = () => { pickerMode.value = 'item'; itemStep.value = 1 }
const closePicker = () => { pickerMode.value = null }
const clearStaff = () => { form.value.staff_id = ''; form.value.staff_name = '' }
const clearItem = () => { form.value.item_id = ''; form.value.item_name = '' }

const isReady = computed(() => form.value.staff_id && form.value.item_id && form.value.score >= 0)

const submitScore = async () => {
  submitting.value = true
  const { error } = await supabase.from('performance_logs').insert([{
    staff_id: form.value.staff_id,
    item_id: form.value.item_id,
    final_score: form.value.score,
    operator_name: form.value.operator_name,
    operator_dept: form.value.operator_dept,
    store_name: form.value.store_name,
    score_date: form.value.date
  }])
  if (!error) { alert('✅ 考核单提交成功！'); clearStaff(); clearItem() }
  else { alert('❌ 提交失败: ' + error.message) }
  submitting.value = false
}

onMounted(loadData)
</script>