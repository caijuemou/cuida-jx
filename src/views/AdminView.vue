<template>
  <div class="max-w-2xl mx-auto pb-24">
    <div class="mb-8 p-6 bg-gradient-to-br from-blue-700 to-indigo-800 rounded-3xl text-white shadow-xl relative overflow-hidden">
      <div class="relative z-10">
        <h2 class="text-2xl font-extrabold tracking-tight">绩效打分工作台</h2>
        <p class="text-blue-100 text-sm mt-1 opacity-90">请选择员工并录入表现项</p>
      </div>
      <div class="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
    </div>

    <div class="mb-8 group">
      <div class="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 transition-all group-focus-within:shadow-indigo-100 group-focus-within:border-indigo-200">
        <div class="relative">
          <input
            v-model="searchStaffQuery"
            @input="debouncedSearchStaff"
            type="text"
            placeholder="搜索姓名或工号 (至少2个字)..."
            class="w-full pl-12 pr-4 py-4 bg-transparent text-gray-700 placeholder-gray-400 outline-none font-medium"
          />
          <div class="absolute left-4 top-4 text-indigo-500">
            <SearchIcon :size="20" />
          </div>
        </div>
      </div>

      <div v-if="staffSearchResults.length && !selectedStaff" class="mt-2 bg-white rounded-2xl shadow-xl border border-gray-50 overflow-hidden divide-y divide-gray-50 z-30 relative">
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
            <div class="text-xs text-indigo-400 font-bold uppercase tracking-wider">当前考核对象</div>
            <div class="text-lg font-black text-indigo-900">{{ selectedStaff.name }}</div>
          </div>
        </div>
        <button @click="clearSelectedStaff" class="p-2 hover:bg-white rounded-xl text-indigo-400 transition-colors">
          <XIcon :size="20" />
        </button>
      </div>
    </Transition>

    <div class="flex overflow-x-auto pb-4 mb-4 space-x-2 scrollbar-hide">
      <button
        @click="activeCategory = '全部'"
        :class="activeCategory === '全部' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-500 border-gray-100'"
        class="px-5 py-2 rounded-full text-sm font-bold border transition-all whitespace-nowrap"
      >
        全部
      </button>
      <button
        v-for="cat in uniqueCategories"
        :key="cat"
        @click="activeCategory = cat"
        :class="activeCategory === cat ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-500 border-gray-100'"
        class="px-5 py-2 rounded-full text-sm font-bold border transition-all whitespace-nowrap"
      >
        {{ cat }}
      </button>
    </div>

    <div v-if="loadingItems" class="py-20 text-center text-gray-400">
      <div class="animate-spin inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mb-4"></div>
      <p>努力加载考核项...</p>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="item in filteredItems"
        :key="item.id"
        class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex justify-between items-center group hover:shadow-md transition-all active:scale-[0.98]"
      >
        <div class="flex-1 pr-4">
          <div class="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">{{ item.category }}</div>
          <div class="text-gray-900 font-extrabold text-lg leading-tight">{{ item.sub_category }}</div>
          <div class="text-sm text-gray-400 mt-1 line-clamp-2 italic">{{ item.description || '无详细描述' }}</div>
        </div>

        <div class="flex flex-col items-end ml-4">
          <div :class="item.score_impact < 0 ? 'text-rose-500 bg-rose-50' : 'text-emerald-500 bg-emerald-50'"
               class="px-3 py-1 rounded-full font-black text-sm mb-3">
            {{ item.score_impact > 0 ? '+' : '' }}{{ item.score_impact }}
          </div>
          <button
            @click="submitScore(item)"
            :disabled="!selectedStaff || submittingItemId === item.id"
            class="bg-gray-900 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-lg shadow-gray-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none hover:bg-indigo-600 transition-all flex items-center"
          >
            <span v-if="submittingItemId === item.id" class="mr-2 animate-spin">●</span>
            {{ submittingItemId === item.id ? '提交中' : '确认提交' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="submittingGlobal" class="fixed inset-0 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center z-50">
      <div class="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center border border-gray-50">
        <div class="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mb-4"></div>
        <p class="font-bold text-gray-800">正在同步薪福通...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../composables/useSupabase'
import { SearchIcon, UserIcon, XIcon } from 'lucide-vue-next'

// --- 员工搜索逻辑 ---
const searchStaffQuery = ref('')
const selectedStaff = ref(null)
const staffSearchResults = ref([])
const loadingStaff = ref(false)
let debounceTimeout = null

const fetchStaff = async (query) => {
  loadingStaff.value = true
  const { data, error } = await supabase
    .from('staff_cache')
    .select('*')
    .or(`name.ilike.%${query}%,xft_user_id.ilike.%${query}%`)
    .limit(5)

  if (!error) staffSearchResults.value = data || []
  loadingStaff.value = false
}

const debouncedSearchStaff = () => {
  clearTimeout(debounceTimeout)
  if (searchStaffQuery.value.length < 2) {
    staffSearchResults.value = []
    return
  }
  debounceTimeout = setTimeout(() => fetchStaff(searchStaffQuery.value), 300)
}

const selectStaff = (staff) => {
  selectedStaff.value = staff
  searchStaffQuery.value = staff.name
}

const clearSelectedStaff = () => {
  selectedStaff.value = null
  searchStaffQuery.value = ''
  staffSearchResults.value = []
}

// --- 考核项加载与筛选 ---
const items = ref([])
const loadingItems = ref(false)
const activeCategory = ref('全部')

const fetchItems = async () => {
  loadingItems.value = true
  const { data, error } = await supabase
    .from('scoring_items')
    .select('*')
    .order('category')

  if (!error) items.value = data || []
  loadingItems.value = false
}

const uniqueCategories = computed(() => {
  return [...new Set(items.value.map(i => i.category))]
})

const filteredItems = computed(() => {
  if (activeCategory.value === '全部') return items.value
  return items.value.filter(i => i.category === activeCategory.value)
})

// --- 提交打分逻辑 ---
const submittingItemId = ref(null)
const submittingGlobal = ref(false)

const submitScore = async (item) => {
  if (!selectedStaff.value) return

  submittingItemId.value = item.id
  // 生产环境建议开启全局 loading 防止重复点击
  // submittingGlobal.value = true

  try {
    const { error } = await supabase.from('performance_logs').insert({
      staff_id: selectedStaff.value.xft_user_id,
      item_id: item.id,
      final_score: item.score_impact,
      operator_name: '管理员', // 后续对接免登获取真实姓名
      sync_status: 'pending'
    })

    if (error) throw error

    alert(`打分成功！已记录: ${selectedStaff.value.name} ${item.score_impact}分`)
  } catch (err) {
    console.error(err)
    alert('提交失败，请检查数据库连接')
  } finally {
    submittingItemId.value = null
    submittingGlobal.value = false
  }
}

onMounted(() => {
  fetchItems()
})
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
