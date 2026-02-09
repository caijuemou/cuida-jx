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
import { SearchIcon, UserIcon, XIcon, ChevronRightIcon, ChevronLeftIcon, CheckCircleIcon, LayersIcon, HistoryIcon, LayoutGridIcon } from 'lucide-vue-next'

// --- 状态定义 ---
const form = ref({ staff_id: '', staff_name: '', store_name: '', date: new Date().toISOString().split('T')[0], item_id: '', item_name: '', score: 0, operator_name: '管理员', operator_dept: '运营部' })
const allItems = ref([]); const staffTree = ref({}); const submitting = ref(false)
const searchStaffQuery = ref(''); const staffSearchResults = ref([])
const searchItemQuery = ref(''); const itemSearchResults = ref([])
const isManagerMode = ref(false)

const pickerMode = ref(null); 
const staffStep = ref(1); 
const currentRegion = ref(''); 
const currentDistrict = ref(''); 
const currentDept = ref('')
const itemStep = ref(1); 
const currentCategory = ref(''); 
const standardScore = ref(0)

// --- 标题计算逻辑 ---
const currentPickerTitle = computed(() => {
  if (pickerMode.value === 'staff') {
    return ['选择区域', '选择片区', '选择门店', '选择人员'][staffStep.value - 1]
  }
  return ['选择考核分类', '点选具体项'][itemStep.value - 1]
})

// --- 后退逻辑 ---
const goBack = () => {
  if (pickerMode.value === 'staff') {
    if (staffStep.value > 1) staffStep.value--
  } else if (pickerMode.value === 'item') {
    if (itemStep.value > 1) itemStep.value--
  }
}

// --- 数据加载 ---
const loadData = async () => {
  const [staffRes, deptRes, itemsRes] = await Promise.all([
    supabase.from('staff_cache').select('*').eq('is_active', true),
    supabase.from('dept_cache').select('*'),
    supabase.from('scoring_items').select('*').eq('is_active', true)
  ])
  const tree = {}
  staffRes.data?.forEach(s => {
    const deptInfo = deptRes.data?.find(d => d.name === s.dept_name)
    const pathParts = deptInfo?.name_path?.split('/') || []
    const region = pathParts[1] || '其他区域', district = pathParts[2] || '其他网点', store = s.dept_name
    if (!tree[region]) tree[region] = {}
    if (!tree[region][district]) tree[region][district] = {}
    if (!tree[region][district][store]) tree[region][district][store] = []
    tree[region][district][store].push(s)
  })
  staffTree.value = tree
  allItems.value = itemsRes.data || []
}

// --- 过滤逻辑 ---
const filteredItems = computed(() => {
  const role = isManagerMode.value ? 'manager' : 'staff'
  return allItems.value.filter(i => i.applicable_to === role)
})

// --- 搜索逻辑 ---
const handleStaffSearch = async () => {
  if (searchStaffQuery.value.length < 1) return staffSearchResults.value = []
  const { data } = await supabase.from('staff_cache').select('*').eq('is_active', true)
    .or(`name.ilike.%${searchStaffQuery.value}%,xft_user_id.ilike.%${searchStaffQuery.value}%`).limit(10)
  staffSearchResults.value = data || []
}

const handleItemSearch = () => {
  if (searchItemQuery.value.length < 1) return itemSearchResults.value = []
  itemSearchResults.value = filteredItems.value.filter(i => i.sub_category.includes(searchItemQuery.value)).slice(0, 8)
}

// --- 选中处理 ---
const selectStaff = (s) => {
  form.value.staff_id = s.xft_user_id; form.value.staff_name = s.name; form.value.store_name = s.dept_name
  const job = s.job_title || ''
  isManagerMode.value = job.includes('店长') || job.includes('店经理')
  clearItem(); closePicker()
}

const selectItem = (i) => {
  form.value.item_id = i.id; form.value.item_name = i.sub_category; form.value.category_name = i.category; form.value.score = i.score_impact; standardScore.value = i.score_impact
  closePicker()
}

// --- 级联选项计算 ---
const currentStaffOptions = computed(() => {
  if (staffStep.value === 1) return Object.keys(staffTree.value)
  if (staffStep.value === 2) return Object.keys(staffTree.value[currentRegion.value] || {})
  if (staffStep.value === 3) return Object.keys(staffTree.value[currentRegion.value]?.[currentDistrict.value] || {})
  return staffTree.value[currentRegion.value]?.[currentDistrict.value]?.[currentDept.value] || []
})

const handleStaffStepClick = (val) => {
  if (staffStep.value === 1) { currentRegion.value = val; staffStep.value = 2 }
  else if (staffStep.value === 2) { currentDistrict.value = val; staffStep.value = 3 }
  else if (staffStep.value === 3) { currentDept.value = val; staffStep.value = 4 }
  else { selectStaff(val) }
}

const currentItemOptions = computed(() => {
  if (itemStep.value === 1) return [...new Set(filteredItems.value.map(i => i.category))]
  return filteredItems.value.filter(i => i.category === currentCategory.value)
})

const handleItemStepClick = (val) => {
  if (itemStep.value === 1) { currentCategory.value = val; itemStep.value = 2 }
  else { selectItem(val) }
}

// --- 辅助方法 ---
const clearStaff = () => { form.value.staff_id = ''; form.value.staff_name = ''; isManagerMode.value = false; clearItem() }
const clearItem = () => { form.value.item_id = ''; form.value.item_name = ''; form.value.score = 0 }
const openStaffPicker = () => { console.log('打开人员选择器'); pickerMode.value = 'staff'; staffStep.value = 1 }
const openItemPicker = () => { pickerMode.value = 'item'; itemStep.value = 1 }
const closePicker = () => { pickerMode.value = null }
const isReady = computed(() => form.value.staff_id && form.value.item_id)

// --- 提交逻辑 (联动薪福通版) ---
const submitScore = async () => {
  if (submitting.value) return;
  submitting.value = true;

  try {
    // 0. 获取当前登录者（发起人）
    const me = JSON.parse(localStorage.getItem('user_info') || '{}');
    if (!me.xft_user_id) throw new Error("未找到当前登录用户信息，请重新登录");

    // 1. 获取选中的被考核人详细信息 (从 staffTree 中通过 ID 找，确保数据完整)
    const allStaffList = Object.values(staffTree.value).flatMap(d => Object.values(d)).flatMap(s => Object.values(s)).flat();
    const targetStaff = allStaffList.find(s => s.xft_user_id === form.value.staff_id);

    // 2. 构造本地数据库记录
    const record = {
      starter_id: me.xft_user_id,
      starter_name: me.name,
      target_user_id: form.value.staff_id,
      target_name: form.value.staff_name,
      target_dept_name: form.value.store_name,
      target_job_title: targetStaff?.job_title || '员工',
      category_label: form.value.category_name,
      score_value: String(form.value.score),
      description: `考核项: ${form.value.item_name}，分值: ${form.value.score}`,
      record_date: form.value.date
    };

    // 3. 插入本地数据库 perf_records (你刚才建的表)
    const { data: dbData, error: dbError } = await supabase
      .from('perf_records')
      .insert(record)
      .select()
      .single();

    if (dbError) throw new Error("本地保存失败: " + dbError.message);

    // 4. 联动薪福通：调用 Edge Function
    // 注意：确保你已经在终端执行过 supabase functions deploy xft-start-flow
    const { data: xftData, error: invokeError } = await supabase.functions.invoke('xft-start-flow', {
      body: { record: dbData } 
    });

    if (invokeError) throw new Error("连接 Edge Function 失败: " + invokeError.message);

    // 5. 判断招行真实的返回码 (由 Gateway 解密后传回)
    if (xftData?.returnCode === "SUC0000") {
      await supabase
        .from('perf_records')
        .update({ 
          xft_proc_inst_id: xftData.body?.procInstId,
          sync_status: 'success' 
        })
        .eq('id', dbData.id);

      alert(`✅ 提交成功！单号: ${xftData.body.procInstId}`);
      clearStaff();
    } else {
      // 处理招行具体的业务报错 (比如你之前的 OA0F004)
      const errorMsg = xftData?.errorMsg || "招行接口报错";
      
      // 更新本地状态为同步失败
      await supabase.from('perf_records').update({ sync_status: 'failed' }).eq('id', dbData.id);
      
      throw new Error(errorMsg);
    }

  } catch (err) {
    console.error('提交异常:', err);
    alert('❌ 操作失败: ' + err.message);
  } finally {
    submitting.value = false;
  }
};

onMounted(loadData)
</script>
