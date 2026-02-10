<template>
  <div class="max-w-2xl mx-auto pb-32 px-4 space-y-8 text-base">
    <div class="flex justify-end">
      <router-link to="/admin/history" class="flex items-center gap-2 px-4 py-2 bg-blue-100/80 rounded-2xl border border-slate-100 shadow-sm text-xs font-black text-slate-500 hover:text-indigo-600 transition-all">
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
	<div v-if="pickerMode" class="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end">
		  <div class="bg-white w-full rounded-t-[3rem] p-8 max-h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
			
			<div class="flex justify-between items-center mb-6">
			  <div class="flex items-center gap-3">
				<button v-if="(pickerMode === 'staff' && staffStep > 1) || (pickerMode === 'item' && itemStep > 1)" 
						@click="goBack" 
						class="p-2 bg-gray-100 rounded-xl text-gray-500 hover:bg-gray-200 transition-colors">
				  <ChevronLeftIcon :size="20" />
				</button>
				<h3 class="text-2xl font-black text-gray-900">{{ currentPickerTitle }}</h3>
			  </div>
			  <button @click="closePicker" class="p-3 bg-gray-100 rounded-2xl"><XIcon :size="20"/></button>
			</div>

			<div class="flex-1 overflow-y-auto space-y-3 pb-12">
			  <template v-if="pickerMode === 'staff'">
				<button v-for="item in currentStaffOptions" :key="item" @click="handleStaffStepClick(item)" 
						class="w-full p-5 bg-gray-50 rounded-2xl text-left font-black text-gray-700 flex justify-between items-center hover:bg-indigo-50 transition-colors border border-transparent active:border-indigo-200">
				  <span>{{ item.name || item }}</span>
				  <ChevronRightIcon :size="20" class="text-gray-300" />
				</button>
			  </template>

			  <template v-if="pickerMode === 'item'">
				<button v-for="item in currentItemOptions" :key="item.id || item" @click="handleItemStepClick(item)" 
						class="w-full p-5 bg-gray-50 rounded-2xl text-left font-black text-gray-700 flex justify-between items-center hover:bg-emerald-50 transition-colors border border-transparent active:border-emerald-200">
				  <div class="flex flex-col">
					<span>{{ item.sub_category || item }}</span>
					<span v-if="item.score_impact" class="text-[10px] text-emerald-500 mt-1 uppercase font-black">标准分值: {{ item.score_impact }}分</span>
				  </div>
				  <ChevronRightIcon :size="20" class="text-gray-300" />
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
import { 
  SearchIcon, UserIcon, XIcon, ChevronRightIcon, 
  ChevronLeftIcon, CheckCircleIcon, LayersIcon, 
  HistoryIcon, LayoutGridIcon 
} from 'lucide-vue-next'

// --- 1. 状态定义 ---
const form = ref({ 
  staff_id: '', 
  staff_name: '', 
  store_name: '', 
  date: new Date().toISOString().split('T')[0], 
  item_id: '', 
  item_name: '', 
  category_name: '',
  score: 0 
})

const allItems = ref([])
const staffTree = ref({})
const submitting = ref(false)
const searchStaffQuery = ref('')
const staffSearchResults = ref([])
const searchItemQuery = ref('')
const itemSearchResults = ref([])
const isManagerMode = ref(false)

// 选择器控制
const pickerMode = ref(null) 
const staffStep = ref(1) 
const currentRegion = ref('') 
const currentDistrict = ref('') 
const currentDept = ref('')
const itemStep = ref(1) 
const currentCategory = ref('') 
const standardScore = ref(0)

// --- 2. 核心数据加载与权限逻辑 ---
const loadData = async () => {
  try {
    // 获取当前登录者信息
    const me = JSON.parse(localStorage.getItem('user_info') || '{}')
    const myVNumber = me.xft_user_id

    // 并行请求数据
    const [staffRes, deptRes, itemsRes] = await Promise.all([
      supabase.from('staff_cache').select('*').eq('is_active', true),
      supabase.from('dept_cache').select('*'),
      supabase.from('scoring_items').select('*').eq('is_active', true)
    ])

    // 确定登录人身份
    const myInfo = staffRes.data?.find(s => s.xft_user_id === myVNumber)
    const isStoreManager = myInfo?.job_title?.includes('店长') || myInfo?.job_title?.includes('店经理')
    const myDept = myInfo?.dept_name
    // 是否为受限店长（非管理组的店长）
    const isRestrictedManager = isStoreManager && myDept !== '公司管理组'

    const tree = {}
    
    staffRes.data?.forEach(s => {
      // 权限过滤：店长只能看到自己店的人
      if (isRestrictedManager && s.dept_name !== myDept) return

      const deptInfo = deptRes.data?.find(d => d.name === s.dept_name)
      const pathParts = deptInfo?.name_path?.split('/') || []
      
      let region, district, store

      if (isRestrictedManager) {
        // 店长权限：简化路径
        region = '本门店'
        district = myDept
        store = s.dept_name
      } else if (pathParts.length <= 2) {
        // 职能部门权限（管理组、后勤组等）
        region = '总部/职能部门'
        district = s.dept_name
        store = s.dept_name
      } else {
        // 门店三级联动
        region = pathParts[1] || '其他区域'
        district = pathParts[2] || '其他网点'
        store = s.dept_name
      }

      if (!tree[region]) tree[region] = {}
      if (!tree[region][district]) tree[region][district] = {}
      if (!tree[region][district][store]) tree[region][district][store] = []
      tree[region][district][store].push(s)
    })

    staffTree.value = tree
    allItems.value = itemsRes.data || []
  } catch (err) {
    console.error("数据加载失败:", err)
  }
}

// --- 3. 计算属性与交互逻辑 ---

// 动态标题
const currentPickerTitle = computed(() => {
  if (pickerMode.value === 'staff') {
    return ['选择区域', '选择片区', '选择门店', '选择人员'][staffStep.value - 1]
  }
  return ['选择考核分类', '点选具体项'][itemStep.value - 1]
})

// 级联人员选项
const currentStaffOptions = computed(() => {
  if (staffStep.value === 1) return Object.keys(staffTree.value)
  if (staffStep.value === 2) return Object.keys(staffTree.value[currentRegion.value] || {})
  if (staffStep.value === 3) return Object.keys(staffTree.value[currentRegion.value]?.[currentDistrict.value] || {})
  return staffTree.value[currentRegion.value]?.[currentDistrict.value]?.[currentDept.value] || []
})

// 级联考核项选项
const filteredItems = computed(() => {
  const role = isManagerMode.value ? 'manager' : 'staff'
  return allItems.value.filter(i => i.applicable_to === role)
})

const currentItemOptions = computed(() => {
  if (itemStep.value === 1) return [...new Set(filteredItems.value.map(i => i.category))]
  return filteredItems.value.filter(i => i.category === currentCategory.value)
})

// --- 4. 动作处理函数 ---

const handleStaffStepClick = (val) => {
  if (staffStep.value === 1) {
    currentRegion.value = val;
    staffStep.value = 2;
  } 
  else if (staffStep.value === 2) {
    currentDistrict.value = val;
    // 获取下一级（门店级）的所有选项
    const nextOptions = Object.keys(staffTree.value[currentRegion.value]?.[val] || {});
    
    // 关键修复：判断是否为重复层级
    // 如果下一级只有一个选项，且名字和当前点击的一模一样（总部部门特有情况）
    if (nextOptions.length === 1 && nextOptions[0] === val) {
      currentDept.value = val;
      staffStep.value = 4; // 跳过重复级，直接进入选人
    } else {
      staffStep.value = 3; // 正常进入第三级（门店级）
    }
  } 
  else if (staffStep.value === 3) {
    currentDept.value = val;
    staffStep.value = 4;
  } 
  else {
    selectStaff(val);
  }
}

const handleItemStepClick = (val) => {
  if (itemStep.value === 1) { currentCategory.value = val; itemStep.value = 2 }
  else { selectItem(val) }
}

const selectStaff = (s) => {
  form.value.staff_id = s.xft_user_id
  form.value.staff_name = s.name
  form.value.store_name = s.dept_name
  const job = s.job_title || ''
  isManagerMode.value = job.includes('店长') || job.includes('店经理')
  clearItem()
  closePicker()
}

const selectItem = (i) => {
  form.value.item_id = i.id
  form.value.item_name = i.sub_category
  form.value.category_name = i.category
  form.value.score = i.score_impact
  standardScore.value = i.score_impact
  closePicker()
}

// 搜索逻辑（包含权限隔离）
const handleStaffSearch = async () => {
  if (searchStaffQuery.value.length < 1) return staffSearchResults.value = []
  
  const me = JSON.parse(localStorage.getItem('user_info') || '{}')
  let query = supabase.from('staff_cache').select('*').eq('is_active', true)
  
  // 非管理组的店长搜索受限
  if (me.job_title?.includes('店') && me.dept_name !== '公司管理组') {
    query = query.eq('dept_name', me.dept_name)
  }

  const { data } = await query
    .or(`name.ilike.%${searchStaffQuery.value}%,xft_user_id.ilike.%${searchStaffQuery.value}%`)
    .limit(10)
  staffSearchResults.value = data || []
}

const handleItemSearch = () => {
  if (searchItemQuery.value.length < 1) return itemSearchResults.value = []
  itemSearchResults.value = filteredItems.value.filter(i => 
    i.sub_category.includes(searchItemQuery.value)
  ).slice(0, 8)
}

// --- 5. 提交逻辑 ---
const submitScore = async () => {
  if (submitting.value) return
  submitting.value = true

  try {
    const me = JSON.parse(localStorage.getItem('user_info') || '{}')
    if (!me.xft_user_id) throw new Error("登录信息失效，请重新登录")

    // 1. 保存到本地数据库 (perf_records)
    const record = {
      starter_id: me.xft_user_id,
      starter_name: me.name,
      target_user_id: form.value.staff_id,
      target_name: form.value.staff_name,
      target_dept_name: form.value.store_name,
      category_label: form.value.category_name,
      score_value: String(form.value.score),
      description: `考核项: ${form.value.item_name}`,
      record_date: form.value.date
    }

    const { data: dbData, error: dbError } = await supabase
      .from('perf_records')
      .insert(record)
      .select()
      .single()

    if (dbError) throw new Error("数据库保存失败: " + dbError.message)

    // 2. 联动 Edge Function 推送招行工作通知
    const { data: msgResult, error: invokeError } = await supabase.functions.invoke('xft-send-msg', {
      body: { 
        target_user_id: form.value.staff_id, 
        target_name: form.value.staff_name,
        item_name: form.value.item_name,
        score: form.value.score
      } 
    })

    if (invokeError) {
      // 如果消息推送失败，但数据库已存，我们提示用户记录已成功，只是通知没发出去
      console.error("推送详情:", invokeError)
      alert("✅ 考核已记录，但招行通知推送失败，请稍后在后台核对。")
    } else {
      alert("🚀 提交成功！员工将收到招行工作通知。")
    }

    clearStaff() // 成功后重置表单
    
  } catch (err) {
    alert('❌ 操作失败: ' + err.message)
  } finally {
    submitting.value = false
  }
}

// --- 6. 辅助工具 ---
const goBack = () => {
  if (pickerMode.value === 'staff' && staffStep.value > 1) staffStep.value--
  else if (pickerMode.value === 'item' && itemStep.value > 1) itemStep.value--
}
const clearStaff = () => { form.value.staff_id = ''; form.value.staff_name = ''; isManagerMode.value = false; clearItem() }
const clearItem = () => { form.value.item_id = ''; form.value.item_name = ''; form.value.score = 0 }
const openStaffPicker = () => {
  pickerMode.value = 'staff';
  
  const regions = Object.keys(staffTree.value);
  // 如果是受限店长，regions 只有 ["本门店"]
  if (regions.length === 1) {
    currentRegion.value = regions[0];
    const districts = Object.keys(staffTree.value[regions[0]]);
    
    if (districts.length === 1) {
      currentDistrict.value = districts[0];
      const stores = Object.keys(staffTree.value[regions[0]][districts[0]]);
      
      if (stores.length === 1) {
        currentDept.value = stores[0];
        staffStep.value = 4; // 直接进入选人列表
        return;
      }
      staffStep.value = 3;
      return;
    }
    staffStep.value = 2;
    return;
  }
  staffStep.value = 1;
}
const openItemPicker = () => { pickerMode.value = 'item'; itemStep.value = 1 }
const closePicker = () => { pickerMode.value = null }
const isReady = computed(() => form.value.staff_id && form.value.item_id)

onMounted(loadData)
</script>
