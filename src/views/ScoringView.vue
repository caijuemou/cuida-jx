<template>
  <div class="max-w-2xl mx-auto pb-24">
    <div class="mb-8 p-6 bg-gradient-to-br from-indigo-700 to-blue-800 rounded-3xl text-white shadow-xl relative overflow-hidden">
      <div class="relative z-10">
        <h2 class="text-2xl font-extrabold tracking-tight">绩效打分工作台</h2>
        <p class="text-blue-100 text-sm mt-1 opacity-90">录入分值将直接计入扣分统计</p>
      </div>
      <div class="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
    </div>

    <div class="mb-8 group relative">
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

      <div v-if="staffSearchResults && staffSearchResults.length > 0 && !selectedStaff"
           class="absolute w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-50 overflow-hidden divide-y divide-gray-50 z-50">
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

    <Transition name="fade">
      <div v-if="selectedStaff" class="mb-8 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center justify-between shadow-sm">
        <div class="flex items-center">
          <div class="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg mr-4">
            <UserIcon :size="24" />
          </div>
          <div>
            <div class="text-[10px] text-indigo-400 font-black uppercase tracking-widest">当前考评对象</div>
            <div class="text-lg font-black text-indigo-900">{{ selectedStaff.name }}</div>
          </div>
        </div>
        <button @click="clearSelectedStaff" class="p-2 hover:bg-white rounded-xl text-indigo-400 transition-colors">
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
        class="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center group hover:shadow-md transition-all"
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
            class="bg-indigo-600 text-white px-6 py-3.5 rounded-2xl text-xs font-black shadow-xl shadow-indigo-100 disabled:bg-gray-100 disabled:text-gray-300 disabled:shadow-none hover:bg-indigo-700 transition-all active:scale-95"
          >
            提交扣分
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../composables/useSupabase'
import { SearchIcon, UserIcon, XIcon, InfoIcon } from 'lucide-vue-next'

const searchStaffQuery = ref('')
const selectedStaff = ref(null)
const staffSearchResults = ref([])
const items = ref([])
const loadingItems = ref(false)

// --- 搜索逻辑 ---
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
}

const clearSelectedStaff = () => {
  selectedStaff.value = null
  searchStaffQuery.value = ''
}

// --- 加载考核项 ---
const fetchItems = async () => {
  loadingItems.value = true
  // 假设数据库里的 score_impact 已经是正数
  const { data } = await supabase.from('scoring_items').select('*').order('category')
  items.value = (data || []).map(i => ({ ...i, temp_input: null }))
  loadingItems.value = false
}

// --- 提交扣分 ---
const submitScore = async (item) => {
  if (!selectedStaff.value || !item.temp_input) return

  // 1. 超限提醒
  if (item.temp_input > item.score_impact) {
    const proceed = confirm(`该项设定上限为 ${item.score_impact} 分，确认按 ${item.temp_input} 分扣除吗？`)
    if (!proceed) return
  }

  // 2. 存储逻辑：直接存入正数
  try {
    const { error } = await supabase.from('performance_logs').insert({
      staff_id: selectedStaff.value.xft_user_id,
      item_id: item.id,
      final_score: Math.abs(item.temp_input), // 强制取正值存储
      operator_name: '管理员',
      sync_status: 'pending'
    })

    if (error) throw error

    alert(`已记录：${selectedStaff.name} 扣除 ${item.temp_input} 分`)
    item.temp_input = null
  } catch (err) {
    console.error(err)
    alert('提交失败，请检查网络')
  }
}

onMounted(fetchItems)
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
input[type=number] { -moz-appearance: textfield; }
</style>
