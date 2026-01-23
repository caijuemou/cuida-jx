<template>
  <div class="pb-20">
    <h2 class="text-2xl font-bold mb-6 text-gray-800">打分操作台</h2>

    <div class="p-4 bg-white border border-gray-100 rounded-xl shadow-sm mb-6">
      <h3 class="font-semibold text-gray-700 mb-3">选择员工</h3>
      <div class="relative mb-3">
        <input
          v-model="searchStaffQuery"
          @input="debouncedSearchStaff"
          type="text"
          placeholder="输入工号或姓名搜索员工..."
          class="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <span class="absolute left-3 top-2.5 text-gray-400">🔍</span>
      </div>

      <div v-if="loadingStaff" class="text-center text-gray-500">加载中...</div>
      <div v-else-if="staffSearchResults.length && !selectedStaff" class="mt-2 bg-gray-50 p-2 rounded-lg max-h-40 overflow-y-auto">
        <div
          v-for="staff in staffSearchResults"
          :key="staff.xft_user_id"
          @click="selectStaff(staff)"
          class="p-2 cursor-pointer hover:bg-blue-100 rounded-md transition-colors flex justify-between items-center"
        >
          <span>{{ staff.name }} <span class="text-sm text-gray-500 ml-1">({{ staff.dept_name }})</span></span>
          <span class="text-xs text-blue-600">{{ staff.job_title }}</span>
        </div>
      </div>
      <div v-else-if="!staffSearchResults.length && searchStaffQuery && !selectedStaff" class="mt-2 text-center text-gray-500">
        无匹配员工
      </div>

      <div v-if="selectedStaff" class="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg flex justify-between items-center">
        <div>
          <span class="font-bold text-blue-800">{{ selectedStaff.name }}</span>
          <span class="text-sm text-gray-500 ml-2">{{ selectedStaff.job_title }} ({{ selectedStaff.dept_name }})</span>
        </div>
        <button @click="clearSelectedStaff" class="text-xs text-blue-600">重选</button>
      </div>
    </div>

    <div class="flex overflow-x-auto p-2 space-x-2 bg-white sticky top-[100px] z-10 border-b border-gray-100 rounded-xl shadow-sm mb-6 scrollbar-hide">
      <button
        @click="activeCategory = '全部'"
        :class="activeCategory === '全部' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'"
        class="px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors"
      >
        全部
      </button>
      <button
        v-for="cat in uniqueCategories"
        :key="cat"
        @click="activeCategory = cat"
        :class="activeCategory === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'"
        class="px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors"
      >
        {{ cat }}
      </button>
    </div>

    <div v-if="loadingItems" class="text-center text-gray-500 mt-10">加载考核项中...</div>
    <div v-else class="space-y-3">
      <div
        v-for="item in filteredItems"
        :key="item.id"
        class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-start"
      >
        <div class="flex-1 pr-4">
          <div class="text-gray-800 font-medium">{{ item.sub_category }}</div>
          <div class="text-xs text-gray-500 mt-1">{{ item.description }}</div>
        </div>
        <div class="text-right">
          <div :class="item.score_impact < 0 ? 'text-red-500' : 'text-green-500'" class="font-bold">
            {{ item.score_impact > 0 ? '+' : '' }}{{ item.score_impact }} 分
          </div>
          <button
            @click="submitScore(item)"
            :disabled="!selectedStaff || submittingItemId === item.id"
            class="mt-2 px-4 py-1 bg-blue-600 text-white text-xs rounded-lg disabled:bg-gray-300 active:scale-95 transition-transform"
          >
            {{ submittingItemId === item.id ? '提交中...' : '提交' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="submittingGlobal" class="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg shadow-xl flex items-center">
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>同步至薪福通中...</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../composables/useSupabase'

// --- 员工搜索与选择 ---
const searchStaffQuery = ref('')
const selectedStaff = ref(null)
const staffSearchResults = ref([])
const loadingStaff = ref(false)
let debounceTimeout = null

const fetchStaff = async (query) => {
  loadingStaff.value = true
  let { data, error } = await supabase
    .from('staff_cache')
    .select('xft_user_id, name, dept_name, job_title')
    .ilike('name', `%${query}%`) // 模糊搜索姓名
    .limit(10) // 限制搜索结果数量

  if (error) {
    console.error('Error fetching staff:', error.message)
    staffSearchResults.value = []
  } else {
    staffSearchResults.value = data || []
  }
  loadingStaff.value = false
}

const debouncedSearchStaff = () => {
  clearTimeout(debounceTimeout)
  debounceTimeout = setTimeout(() => {
    if (searchStaffQuery.value.length >= 2) { // 至少输入两个字符才开始搜索
      fetchStaff(searchStaffQuery.value)
    } else {
      staffSearchResults.value = []
    }
  }, 300)
}

const selectStaff = (staff) => {
  selectedStaff.value = staff
  searchStaffQuery.value = staff.name // 清空搜索框或显示已选员工姓名
  staffSearchResults.value = [] // 清空搜索结果
}

const clearSelectedStaff = () => {
  selectedStaff.value = null
  searchStaffQuery.value = ''
  staffSearchResults.value = []
}

// --- 考核项加载与筛选 ---
const activeCategory = ref('全部')
const allItems = ref([])
const loadingItems = ref(false)

const uniqueCategories = computed(() => {
  const categories = new Set(allItems.value.map(item => item.category))
  return [...categories]
})

const filteredItems = computed(() => {
  if (activeCategory.value === '全部') {
    return allItems.value
  }
  return allItems.value.filter(item => item.category === activeCategory.value)
})

const fetchScoringItems = async () => {
  loadingItems.value = true
  const { data, error } = await supabase
    .from('scoring_items')
    .select('*')
    .order('category', { ascending: true })
    .order('sub_category', { ascending: true })

  if (error) {
    console.error('Error fetching scoring items:', error.message)
    alert('加载考核项失败，请检查网络或联系管理员。')
    allItems.value = []
  } else {
    allItems.value = data || []
  }
  loadingItems.value = false
}

// --- 提交打分 ---
const submittingItemId = ref(null) // 用于单个按钮的 loading 状态
const submittingGlobal = ref(false) // 用于全局的 loading 状态

const submitScore = async (item) => {
  if (!selectedStaff.value) {
    alert('请先选择员工再提交打分！')
    return
  }

  submittingItemId.value = item.id
  submittingGlobal.value = true

  const logData = {
    staff_id: selectedStaff.value.xft_user_id,
    item_id: item.id,
    final_score: item.score_impact,
    operator_name: '管理员 (待薪福通OAuth集成)', // TODO: 这里需要替换为真实操作员信息
    sync_status: 'pending'
  }

  // 1. 记录到本地 Supabase 日志
  const { data: logEntry, error: logError } = await supabase
    .from('performance_logs')
    .insert(logData)
    .select()

  if (logError) {
    console.error('Error saving performance log:', logError.message)
    alert('本地记录失败，请重试或联系管理员。')
    submittingItemId.value = null
    submittingGlobal.value = false
    return
  }

  // 2. 调用 Supabase Edge Function (对接薪福通API)
  try {
    const { data: xftResponse, error: functionError } = await supabase.functions.invoke('sync-to-xft', {
      body: JSON.stringify({
        logId: logEntry[0].id,
        staffId: selectedStaff.value.xft_user_id,
        itemName: item.sub_category,
        score: item.score_impact,
        // ... 其他需要传递给薪福通的数据
      }),
    })

    if (functionError) {
      throw new Error(functionError.message);
    }

    if (xftResponse && xftResponse.success) {
      // 3. 更新本地日志状态为成功
      await supabase
        .from('performance_logs')
        .update({ sync_status: 'success', xft_sync_id: xftResponse.xft_record_id }) // 假设薪福通返回一个记录ID
        .eq('id', logEntry[0].id)
      alert(`为 ${selectedStaff.value.name} 提交 ${item.sub_category} 成功，并已同步至薪福通！`)
    } else {
      // 薪福通API返回失败
      console.error('薪福通API同步失败:', xftResponse);
      await supabase
        .from('performance_logs')
        .update({ sync_status: 'failed' })
        .eq('id', logEntry[0].id)
      alert(`薪福通同步失败：${xftResponse?.message || '未知错误'}`)
    }

  } catch (error) {
    console.error('调用Supabase Function或薪福通API失败:', error.message)
    await supabase
        .from('performance_logs')
        .update({ sync_status: 'failed' })
        .eq('id', logEntry[0].id)
    alert('提交失败，请检查网络或联系管理员。')
  } finally {
    submittingItemId.value = null
    submittingGlobal.value = false
  }
}

onMounted(() => {
  fetchScoringItems()
  // 模拟从薪福通拉取管理员信息，填充 operator_name
  // TODO: 这里需要真正的薪福通免登集成
})
</script>

<style scoped>
/* Scrollbar hide utility */
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}
.scrollbar-hide {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
}
</style>
