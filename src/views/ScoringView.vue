<template>
  <div class="max-w-2xl mx-auto pb-32 px-4 space-y-8 text-base">
    <div v-if="canAccessScoring" class="flex justify-end">
      <button @click="() => router.push('/history')" class="flex items-center gap-2 px-4 py-2 bg-blue-100/80 rounded-2xl border border-slate-100 shadow-sm text-xs font-black text-slate-500 hover:text-indigo-600 transition-all">
        <HistoryIcon :size="16" />查看历史记录
      </button>
    </div>

    <section class="bg-white p-7 rounded-[2rem] shadow-sm border border-gray-100">
      <div class="flex justify-between items-center mb-5">
        <label class="text-xs font-black text-indigo-500 uppercase tracking-widest">1. 选择被考核人员</label>
        <button v-if="form.staff_id" @click="clearStaff" class="text-xs font-bold text-gray-400 hover:text-rose-500">重置</button>
      </div>

      <div v-if="!form.staff_id" class="relative group">
        <input v-model="searchStaffQuery" @input="handleStaffSearch" type="text" placeholder="输入姓名搜索..." 
          class="w-full pl-12 pr-14 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-indigo-100 focus:bg-white focus:ring-0 text-base font-bold transition-all" />
        <SearchIcon class="absolute left-4 top-4 text-gray-300" :size="20" />
        
        <button @click="openStaffPicker" type="button" class="absolute right-2 top-2 z-20 p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
          <LayersIcon :size="20" />
        </button>
        
        <div v-if="staffSearchResults.length > 0" class="absolute z-[70] w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
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
        <input v-model="searchItemQuery" @input="handleItemSearch" type="text" placeholder="搜索考核项..." 
          class="w-full pl-12 pr-14 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-emerald-100 focus:bg-white focus:ring-0 text-base font-bold transition-all" />
        <SearchIcon class="absolute left-4 top-4 text-gray-300" :size="20" />
        
        <button @click="openItemPicker" type="button" class="absolute right-2 top-2 z-20 p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
          <LayoutGridIcon :size="20" />
        </button>
        
        <div v-if="itemSearchResults.length > 0" class="absolute z-[70] w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          <div v-for="i in itemSearchResults" :key="i.id" @click="selectItem(i)" class="p-4 hover:bg-emerald-50 cursor-pointer border-b border-gray-50 last:border-none">
            <div class="font-bold text-gray-800">{{ i.sub_category }}</div>
            <div class="text-xs text-emerald-500 font-bold">{{ i.category }} · 标准分: {{ i.score_impact }}</div>
          </div>
        </div>
      </div>

      <div v-else class="space-y-6">
        <div class="p-6 bg-emerald-50 rounded-[1.5rem] border border-emerald-100">
          <div class="text-lg font-black text-emerald-900 leading-snug mb-4">{{ form.item_name }}</div>
          <div class="flex items-center justify-between pt-5 border-t border-emerald-100">
            <div class="flex flex-col">
              <span class="text-xs font-black text-rose-500 uppercase">本次扣分</span>
              <span class="text-[10px] text-gray-400 font-bold">标准扣除: {{ standardScore }}分</span>
            </div>
            <div class="flex items-center bg-white rounded-2xl border-2 border-emerald-200 px-4 py-1 shadow-inner">
              <input v-model.number="form.score" type="number" class="w-16 py-2 bg-transparent border-none text-center font-black text-rose-600 text-2xl focus:ring-0" />
              <span class="text-gray-300 font-black ml-1 text-sm">分</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="bg-white p-7 rounded-[2rem] shadow-sm border border-gray-100 space-y-4">
      <label class="text-xs font-black text-purple-700 uppercase tracking-widest flex items-center gap-2">
        <Edit3Icon :size="14" /> 3. 填写具体描述
      </label>
      
      <div class="relative group">
        <textarea 
          v-model="form.description" 
          rows="3" 
          placeholder="请详细描述违规情况或加分事宜..." 
          class="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-purple-100 focus:bg-white focus:ring-0 text-base font-medium transition-all resize-none placeholder:text-gray-400 placeholder:text-base placeholder:font-medium"
        ></textarea>
      </div>
    </section>

    <section class="bg-indigo-50/50 p-7 rounded-[2rem] border border-indigo-100/50">
      <button @click="submitScore" :disabled="!isReady || submitting" 
        class="w-full py-5 bg-indigo-600 rounded-3xl font-black text-lg text-white shadow-xl shadow-indigo-200 active:scale-95 transition-all disabled:bg-gray-200 disabled:shadow-none">
        {{ submitting ? '薪福通同步中...' : '发起薪福通审批' }}
      </button>
    </section>

    <Transition name="fade">
      <div v-if="pickerMode" class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="closePicker"></div>
        <div class="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative overflow-hidden">
          <div class="p-6 border-b border-slate-50 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <button v-if="(pickerMode === 'staff' && staffStep > 1) || (pickerMode === 'item' && itemStep > 1)" 
                @click="goBack" class="p-2 hover:bg-slate-100 rounded-xl transition-all">
                <ChevronLeftIcon :size="20" />
              </button>
              <h3 class="text-lg font-black text-slate-800">{{ currentPickerTitle }}</h3>
            </div>
            <button @click="closePicker" class="p-2.5 bg-slate-50 text-slate-400 hover:text-rose-500 rounded-xl">
              <XIcon :size="20" />
            </button>
          </div>

          <div class="p-4 max-h-[55vh] overflow-y-auto">
            <div class="grid grid-cols-1 gap-2">
              <button v-for="opt in (pickerMode === 'staff' ? currentStaffOptions : currentItemOptions)" 
                :key="typeof opt === 'string' ? opt : (opt.xft_user_id || opt.id)"
                @click="pickerMode === 'staff' ? handleStaffStepClick(opt) : handleItemStepClick(opt)"
                class="w-full p-4 rounded-2xl bg-slate-50 hover:bg-indigo-50 text-left font-bold transition-all flex items-center justify-between group">
                <div class="flex flex-col">
                   <span class="group-hover:text-indigo-600">{{ typeof opt === 'string' ? opt : (opt.name || opt.sub_category) }}</span>
                   <span v-if="opt.job_title" class="text-[10px] text-slate-400">{{ opt.job_title }}</span>
                </div>
                <ChevronRightIcon :size="18" class="text-slate-300 group-hover:text-indigo-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../composables/useSupabase'
import {
  SearchIcon, UserIcon, XIcon, ChevronRightIcon,
  ChevronLeftIcon, CheckCircleIcon, LayersIcon,
  HistoryIcon, LayoutGridIcon
} from 'lucide-vue-next'
import {
  canAccessScoring as checkCanAccessScoring,
  isRestrictedManager
} from '../utils/permissions'

const router = useRouter()
const userInfo = ref(JSON.parse(localStorage.getItem('user_info') || '{}'))

// --- 状态定义 ---
const form = ref({ 
  staff_id: '', staff_name: '', store_name: '', 
  date: new Date().toISOString().split('T')[0], 
  item_id: '', item_name: '', category_name: '', 
  score: 0, 
  description: '' // 新增关联描述字段
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

const canAccessScoring = computed(() => checkCanAccessScoring(userInfo.value))
const isReady = computed(() => form.value.staff_id && form.value.item_id)

// --- 数据初始化 ---
const loadData = async () => {
  if (!canAccessScoring.value) { router.push('/history'); return; }
  try {
    const [staffRes, deptRes, itemsRes] = await Promise.all([
      supabase.from('staff_cache').select('*').eq('is_active', true),
      supabase.from('dept_cache').select('*'),
      supabase.from('scoring_items').select('*').eq('is_active', true)
    ])

    const myInfo = staffRes.data?.find(s => s.xft_user_id === userInfo.value.xft_user_id)
    const userIsRestricted = isRestrictedManager(userInfo.value)
    const myDept = myInfo?.dept_name

    const tree = {}
    staffRes.data?.forEach(s => {
      if (userIsRestricted && s.dept_name !== myDept) return
      const deptInfo = deptRes.data?.find(d => d.name === s.dept_name)
      const pathParts = deptInfo?.name_path?.split('/') || []
      
      let region, district, store
      if (userIsRestricted) {
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
  } catch (err) { console.error("加载失败:", err) }
}

// --- 搜索与选择逻辑 ---
const handleStaffSearch = async () => {
  if (searchStaffQuery.value.length < 1) return staffSearchResults.value = []
  const { data } = await supabase.from('staff_cache')
    .select('*').eq('is_active', true)
    .or(`name.ilike.%${searchStaffQuery.value}%,xft_user_id.ilike.%${searchStaffQuery.value}%`)
    .limit(10)
  staffSearchResults.value = data || []
}

const handleItemSearch = () => {
  if (searchItemQuery.value.length < 1) return itemSearchResults.value = []
  itemSearchResults.value = filteredItems.value.filter(i => i.sub_category.includes(searchItemQuery.value)).slice(0, 8)
}

const selectStaff = (s) => {
  form.value.staff_id = s.xft_user_id
  form.value.staff_name = s.name
  form.value.store_name = s.dept_name
  const job = s.job_title || ''

  const specialManagerIds = ['V00A1', 'V0092', 'V00A8', 'V00AI', 'V0072', 'V008W', 'V00AX', 'V0096']
  
  isManagerMode.value = job.includes('店长') || job.includes('店经理') ||
  specialManagerIds.includes(s.xft_user_id)
  clearItem(); closePicker();
}

const selectItem = (i) => {
  form.value.item_id = i.id
  form.value.item_name = i.sub_category
  form.value.category_name = i.category
  form.value.score = i.score_impact 
  standardScore.value = i.score_impact 
  closePicker()
}

// --- 核心同步函数：调用薪福通 OA 发起 ---
const submitScore = async () => {
  if (submitting.value) return
  submitting.value = true

  try {
    const me = JSON.parse(localStorage.getItem('user_info') || '{}')
    if (!me.xft_user_id) throw new Error("请重新登录")

    // 1. 本地落库存档
    const record = {
      starter_id: me.xft_user_id,
      starter_name: me.name,
      target_user_id: form.value.staff_id,
      target_name: form.value.staff_name,
      target_dept_name: form.value.store_name,
      category_label: form.value.category_name,
      score_value: String(form.value.score), 
      score_impact: String(standardScore.value),
      description: `考核项: ${form.value.item_name}`,
      detail_reason: `具体描述: ${form.value.description}`,
      record_date: form.value.date,
      sync_status: 'pending',
      proc_inst_id: null
    }

    const { data: dbData, error: dbError } = await supabase.from('perf_records').insert(record).select().single()
    if (dbError) throw new Error("保存失败: " + dbError.message)

    // 2. 调用 Edge Function 发起流程
    const { data: xftResult, error: invokeError } = await supabase.functions.invoke('xft-start-flow', {
      body: {
        staffId: form.value.staff_id,
        score: form.value.score,
        desc: `【${form.value.category_name}】${form.value.item_name} (标准分:${standardScore.value}分)`,
        detailReason: form.value.description || '无具体描述',
        starterId: me.xft_user_id
      }
    })

    if (invokeError) {
       await supabase.from('perf_records').update({ sync_status: 'failed' }).eq('id', dbData.id)
       throw new Error("薪福通通讯失败: " + invokeError.message)
    }
    // 3. 处理薪福通返回结果
    if (xftResult.xftResponse?.returnCode === 'SUC0000') {
      // 提取 ID (兼容处理不同可能的路径)
      const procId = xftResult.xftResponse.body?.procInstId || xftResult.xftResponse.procInstId
      
      if (!procId) {
        console.warn("薪福通未返回 procInstId，请检查接口返回结构", xftResult)
      }

      // 【核心改动】执行更新并等待结果
      const { error: updateError } = await supabase
        .from('perf_records')
        .update({ 
          sync_status: 'sent',
          proc_inst_id: procId // 确保数据库字段名完全一致
        })
        .eq('id', dbData.id)

      if (updateError) throw new Error("ID 回写数据库失败: " + updateError.message)

      alert(`✅ 提交成功！\n薪福通审批流程ID: ${procId}`)
      clearStaff()
    } else {
      const errorMsg = xftResult.xftResponse?.errorMsg || "同步异常"
      await supabase.from('perf_records').update({ sync_status: 'failed' }).eq('id', dbData.id)
      throw new Error(errorMsg)
    }

  } catch (err) {
    alert('❌ 操作失败: ' + err.message)
  } finally {
    submitting.value = false
  }
}

// --- 辅助 Picker 逻辑 ---
const currentPickerTitle = computed(() => {
  if (pickerMode.value === 'staff') return ['区域', '片区', '门店', '人员'][staffStep.value - 1]
  return ['分类', '具体项'][itemStep.value - 1]
})
const currentStaffOptions = computed(() => {
  if (staffStep.value === 1) return Object.keys(staffTree.value)
  if (staffStep.value === 2) return Object.keys(staffTree.value[currentRegion.value] || {})
  if (staffStep.value === 3) return Object.keys(staffTree.value[currentRegion.value]?.[currentDistrict.value] || {})
  return staffTree.value[currentRegion.value]?.[currentDistrict.value]?.[currentDept.value] || []
})
const filteredItems = computed(() => allItems.value.filter(i => i.applicable_to === (isManagerMode.value ? 'manager' : 'staff')))
const currentItemOptions = computed(() => {
  if (itemStep.value === 1) return [...new Set(filteredItems.value.map(i => i.category))]
  return filteredItems.value.filter(i => i.category === currentCategory.value)
})
const handleStaffStepClick = (val) => {
  if (staffStep.value === 1) { currentRegion.value = val; staffStep.value = 2; } 
  else if (staffStep.value === 2) { currentDistrict.value = val; staffStep.value = 3; } 
  else if (staffStep.value === 3) { currentDept.value = val; staffStep.value = 4; } 
  else { selectStaff(val); }
}
const handleItemStepClick = (val) => {
  if (itemStep.value === 1) { currentCategory.value = val; itemStep.value = 2 }
  else { selectItem(val) }
}
const goBack = () => { if (pickerMode.value === 'staff') staffStep.value--; else itemStep.value--; }
const openStaffPicker = () => { pickerMode.value = 'staff'; staffStep.value = 1; }
const openItemPicker = () => { pickerMode.value = 'item'; itemStep.value = 1 }
const closePicker = () => { pickerMode.value = null }
const clearStaff = () => { 
  form.value.staff_id = ''; 
  form.value.staff_name = ''; 
  form.value.description = ''; // 重置描述
  clearItem(); 
}
const clearItem = () => { 
  form.value.item_id = ''; 
  form.value.item_name = ''; 
  form.value.score = 0; 
  form.value.description = ''; // 清除项目时也重置描述
}

onMounted(loadData)
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
textarea { font-family: inherit; }
</style>
