<template>
  <div class="max-w-6xl mx-auto p-4 md:p-6 pb-24 space-y-6">
    <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 space-y-4">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 class="text-2xl font-black text-gray-900 tracking-tight">考核记录台账</h1>
          <div class="flex items-center gap-2 mt-1">
            <p class="text-gray-400 text-[10px] font-medium italic uppercase">Performance Audit Trail</p>
            <span class="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] rounded-lg font-bold">当前筛选: {{ filteredLogs.length }} 条</span>
          </div>
        </div>
        
        <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div class="flex bg-gray-100 p-1 rounded-xl">
            <button @click="setToThisMonth" class="px-3 py-1.5 text-[10px] font-black rounded-lg transition-all" 
                    :class="isThisMonth ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400'">本月</button>
            <button @click="setToLastMonth" class="px-3 py-1.5 text-[10px] font-black rounded-lg transition-all"
                    :class="isLastMonth ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400'">上月</button>
          </div>

          <div class="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
            <input v-model="startDate" type="date" class="bg-transparent border-none text-xs font-black focus:ring-0 p-0 text-gray-600" />
            <span class="text-gray-300 text-xs">-</span>
            <input v-model="endDate" type="date" class="bg-transparent border-none text-xs font-black focus:ring-0 p-0 text-gray-600" />
          </div>

          <button @click="exportToExcel" :disabled="filteredLogs.length === 0"
                  class="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black flex items-center gap-2 hover:bg-emerald-700 transition-all disabled:bg-gray-200 shadow-lg shadow-emerald-100">
            <DownloadIcon :size="16" /> 导出报表
          </button>
        </div>
      </div>

      <div class="relative w-full">
        <input v-model="filterQuery" type="text" placeholder="搜索姓名、工号、门店或考核项..." 
               class="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl text-sm font-bold transition-all focus:ring-0" />
        <SearchIcon class="absolute left-4 top-4 text-gray-300" :size="20" />
      </div>
    </div>

    <div class="hidden md:block bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-gray-50/50">
            <th class="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">考核日期</th>
            <th class="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">被考核人</th>
            <th class="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">所属门店</th>
            <th class="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">大类 / 考核项目</th>
            <th class="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">分值</th>
            <th class="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">管理</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr v-for="log in filteredLogs" :key="log.id" class="hover:bg-slate-50/80 transition-colors group">
            <td class="p-5 text-sm font-bold text-gray-500">{{ log.score_date }}</td>
            <td class="p-5">
              <div class="font-black text-gray-800">{{ log.staff_name }}</div>
              <div class="text-[10px] text-gray-400 font-bold">ID: {{ log.staff_v_id }}</div>
            </td>
            <td class="p-5 text-sm font-bold text-indigo-600">{{ log.store_name || '未填' }}</td>
            <td class="p-5">
              <div class="text-sm font-bold text-gray-800">{{ log.sub_category }}</div>
              <div class="text-[10px] text-gray-400 uppercase font-bold">{{ log.category }}</div>
            </td>
            <td class="p-5 text-center">
              <span class="text-lg font-black text-rose-500">{{ log.final_score }}</span>
            </td>
            <td class="p-5 text-right">
              <button @click="openEdit(log)" class="p-2 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                <Edit3Icon :size="18" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="md:hidden space-y-4">
      <div v-for="log in filteredLogs" :key="log.id" class="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm relative">
        <div class="flex justify-between items-start mb-3">
          <div>
            <div class="text-xs font-black text-indigo-500 uppercase tracking-tighter">{{ log.store_name }}</div>
            <div class="text-lg font-black text-gray-900">{{ log.staff_name }}</div>
          </div>
          <div class="text-right">
            <div class="text-2xl font-black text-rose-500">{{ log.final_score }}分</div>
          </div>
        </div>
        <div class="bg-gray-50 p-3 rounded-2xl text-sm font-bold text-gray-600 mb-4">
          <div class="text-[10px] text-gray-400">{{ log.category }}</div>
          {{ log.sub_category }}
        </div>
        <div class="flex justify-between items-center">
          <span class="text-[10px] font-bold text-gray-400 italic">{{ log.score_date }}</span>
          <button @click="openEdit(log)" class="px-4 py-2 bg-slate-900 text-white text-xs font-black rounded-xl">编辑</button>
        </div>
      </div>
    </div>

    <div v-if="filteredLogs.length === 0" class="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
      <div class="text-gray-200 mb-4 flex justify-center"><ClipboardXIcon :size="64" /></div>
      <p class="text-gray-400 font-bold">未找到符合条件的考核记录</p>
    </div>

    <div v-if="isModalOpen" class="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-black text-gray-900">修改分值</h3>
          <button @click="isModalOpen = false" class="p-2 bg-gray-100 rounded-full text-gray-400"><XIcon :size="20"/></button>
        </div>
        <div class="space-y-6">
          <div class="p-4 bg-indigo-50 rounded-2xl">
            <div class="font-black text-indigo-900">{{ editingLog.staff_name }}</div>
            <div class="text-sm text-indigo-700/70 font-bold mt-1">{{ editingLog.sub_category }}</div>
          </div>
          <div>
            <label class="block text-xs font-black text-gray-400 uppercase mb-2">修正分值</label>
            <input v-model="editingLog.final_score" type="text" 
                   class="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl font-black text-2xl text-rose-500" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <button @click="handleDelete" class="py-4 bg-rose-50 text-rose-600 rounded-2xl font-black text-sm">删除记录</button>
            <button @click="handleUpdate" class="py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-100">保存修改</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../composables/useSupabase'
import { SearchIcon, Edit3Icon, XIcon, ClipboardXIcon, DownloadIcon } from 'lucide-vue-next'
import * as XLSX from 'xlsx'

const logs = ref([])
const filterQuery = ref('')
const isModalOpen = ref(false)
const editingLog = ref(null)

// --- 日期处理 ---
const formatDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const now = new Date()
const startDate = ref(formatDate(new Date(now.getFullYear(), now.getMonth(), 1)))
const endDate = ref(formatDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)))

const setToThisMonth = () => {
  startDate.value = formatDate(new Date(now.getFullYear(), now.getMonth(), 1))
  endDate.value = formatDate(new Date(now.getFullYear(), now.getMonth() + 1, 0))
}
const setToLastMonth = () => {
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  startDate.value = formatDate(prev)
  endDate.value = formatDate(new Date(now.getFullYear(), now.getMonth(), 0))
}
const isThisMonth = computed(() => startDate.value === formatDate(new Date(now.getFullYear(), now.getMonth(), 1)))
const isLastMonth = computed(() => startDate.value === formatDate(new Date(now.getFullYear(), now.getMonth() - 1, 1)))

// --- 加载数据 (精准对齐你的建表语句) ---
const loadLogs = async () => {
  const { data, error } = await supabase
    .from('perf_records')
    .select(`
      id,
      final_score:score_value,   
      score_date:record_date,    
      store_name:target_dept_name,
      staff_name:target_name,
      staff_v_id:target_user_id,
      category:category_label,
      sub_category:description
    `)
    .order('record_date', { ascending: false })
  
  if (error) {
    console.error("加载失败:", error.message)
  } else {
    logs.value = data || []
  }
}

// --- 过滤逻辑 ---
const filteredLogs = computed(() => {
  return logs.value.filter(l => {
    // 1. 日期区间过滤
    const inDate = l.score_date >= startDate.value && l.score_date <= endDate.value
    // 2. 关键词模糊过滤
    const q = filterQuery.value.toLowerCase()
    const inQuery = !q || 
      l.staff_name?.toLowerCase().includes(q) || 
      l.staff_v_id?.toLowerCase().includes(q) ||
      l.store_name?.toLowerCase().includes(q) ||
      l.sub_category?.toLowerCase().includes(q)
    
    return inDate && inQuery
  })
})

// --- 报表导出 ---
const exportToExcel = () => {
  const exportData = filteredLogs.value.map(log => ({
    '考核日期': log.score_date,
    '姓名': log.staff_name,
    '工号': log.staff_v_id,
    '门店': log.store_name,
    '考核项': log.sub_category,
    '实际扣分': log.final_score
  }))
  const worksheet = XLSX.utils.json_to_sheet(exportData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Records")
  XLSX.writeFile(workbook, `考核报表_${startDate.value}.xlsx`)
}

// --- 操作逻辑 ---
const openEdit = (log) => {
  editingLog.value = { ...log }
  isModalOpen.value = true
}

const handleUpdate = async () => {
  const { error } = await supabase
    .from('perf_records')
    .update({ score_value: String(editingLog.value.final_score) })
    .eq('id', editingLog.value.id)

  if (!error) {
    alert('修改成功')
    isModalOpen.value = false
    loadLogs()
  }
}

const handleDelete = async () => {
  if (!confirm('确定删除？')) return
  const { error } = await supabase
    .from('perf_records')
    .delete()
    .eq('id', editingLog.value.id)

  if (!error) {
    alert('已删除')
    isModalOpen.value = false
    loadLogs()
  }
}

onMounted(loadLogs)
</script>
