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
        <input v-model="filterQuery" type="text" placeholder="快速定位姓名、门店、V号或考核项关键词..." 
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
            <th class="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">考核项目</th>
            <th class="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">分值 (实际/标准)</th>
            <th class="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">管理</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr v-for="log in filteredLogs" :key="log.id" class="hover:bg-slate-50/80 transition-colors group">
            <td class="p-5 text-sm font-bold text-gray-500">{{ log.score_date }}</td>
            <td class="p-5">
              <div class="font-black text-gray-800">{{ log.staff_cache?.name || '未知' }}</div>
              <div class="text-[10px] text-gray-400 font-bold">ID: {{ log.staff_cache?.xft_user_id }}</div>
            </td>
            <td class="p-5 text-sm font-bold text-indigo-600">{{ log.store_name }}</td>
            <td class="p-5">
              <div class="text-sm font-bold text-gray-800">{{ log.scoring_items?.sub_category }}</div>
              <div class="text-[10px] text-gray-400 uppercase font-bold">{{ log.scoring_items?.category }}</div>
            </td>
            <td class="p-5 text-center">
              <span class="text-lg font-black text-rose-500">{{ log.final_score }}</span>
              <span class="text-xs font-bold text-gray-300"> / {{ log.scoring_items?.score_impact }}</span>
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
            <div class="text-lg font-black text-gray-900">{{ log.staff_cache?.name }}</div>
          </div>
          <div class="text-right">
            <div class="text-2xl font-black text-rose-500">-{{ log.final_score }}</div>
            <div class="text-[10px] text-gray-400 font-bold">标准: {{ log.scoring_items?.score_impact }}</div>
          </div>
        </div>
        <div class="bg-gray-50 p-3 rounded-2xl text-sm font-bold text-gray-600 mb-4">
          {{ log.scoring_items?.sub_category }}
        </div>
        <div class="flex justify-between items-center">
          <span class="text-[10px] font-bold text-gray-400 italic">{{ log.score_date }}</span>
          <button @click="openEdit(log)" class="px-4 py-2 bg-slate-900 text-white text-xs font-black rounded-xl">编辑详情</button>
        </div>
      </div>
    </div>

    <div v-if="filteredLogs.length === 0" class="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
      <div class="text-gray-200 mb-4 flex justify-center"><ClipboardXIcon :size="64" /></div>
      <p class="text-gray-400 font-bold">该时间段内暂无考核记录</p>
    </div>

    <div v-if="isModalOpen" class="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-black text-gray-900">修改扣分记录</h3>
          <button @click="isModalOpen = false" class="p-2 bg-gray-100 rounded-full text-gray-400"><XIcon :size="20"/></button>
        </div>
        
        <div class="space-y-6">
          <div class="p-4 bg-indigo-50 rounded-2xl">
            <div class="text-xs text-indigo-400 font-bold uppercase mb-1">正在编辑</div>
            <div class="font-black text-indigo-900">{{ editingLog.staff_cache?.name }} · {{ editingLog.store_name }}</div>
            <div class="text-sm text-indigo-700/70 font-bold mt-1">{{ editingLog.scoring_items?.sub_category }}</div>
          </div>

          <div>
            <label class="block text-xs font-black text-gray-400 uppercase mb-2">修正实际扣分 (标准: {{ editingLog.scoring_items?.score_impact }})</label>
            <input v-model.number="editingLog.final_score" type="number" 
                   class="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:ring-0 rounded-2xl font-black text-2xl text-rose-500" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <button @click="handleDelete" class="py-4 bg-rose-50 text-rose-600 rounded-2xl font-black text-sm hover:bg-rose-100 transition-colors">删除本条</button>
            <button @click="handleUpdate" class="py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">保存修改</button>
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

const now = new Date()
const y = now.getFullYear()
const m = now.getMonth()

// --- 日期初始化 ---
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getFirstDay = (year, month) => formatDate(new Date(year, month, 1));
const getLastDay = (year, month) => formatDate(new Date(year, month + 1, 0));

const startDate = ref(getFirstDay(y, m)); 
const endDate = ref(getLastDay(y, m));

// 快速切换方法
const setToThisMonth = () => {
  startDate.value = getFirstDay(y, m)
  endDate.value = getLastDay(y, m)
}
const setToLastMonth = () => {
  const lastM = new Date(y, m - 1, 1)
  startDate.value = getFirstDay(lastM.getFullYear(), lastM.getMonth())
  endDate.value = getLastDay(lastM.getFullYear(), lastM.getMonth())
}

// 按钮状态高亮判定
const isThisMonth = computed(() => startDate.value === getFirstDay(y, m))
const isLastMonth = computed(() => {
  const lastM = new Date(y, m - 1, 1)
  return startDate.value === getFirstDay(lastM.getFullYear(), lastM.getMonth())
})

// 加载历史数据
const loadLogs = async () => {
  const { data, error } = await supabase
    .from('performance_logs')
    .select(`
      id,
      final_score,
      score_date,
      store_name,
      staff_cache ( name, xft_user_id ),
      scoring_items ( category, sub_category, score_impact )
    `)
    .order('score_date', { ascending: false })
  
  if (!error) logs.value = data
}

// 搜索 + 日期综合过滤
const filteredLogs = computed(() => {
  let result = logs.value

  // 1. 日期过滤
  if (startDate.value && endDate.value) {
    result = result.filter(l => l.score_date >= startDate.value && l.score_date <= endDate.value)
  }

  // 2. 关键词过滤
  if (filterQuery.value) {
    const q = filterQuery.value.toLowerCase()
    result = result.filter(l => 
      l.staff_cache?.name?.toLowerCase().includes(q) || 
      l.staff_cache?.xft_user_id?.toLowerCase().includes(q) ||
      l.store_name?.toLowerCase().includes(q) ||
      l.scoring_items?.sub_category?.toLowerCase().includes(q)
    )
  }
  return result
})

// 导出报表
const exportToExcel = () => {
  const exportData = filteredLogs.value.map(log => ({
    '考核日期': log.score_date,
    '姓名': log.staff_cache?.name,
    '工号/V号': log.staff_cache?.xft_user_id,
    '门店/部门': log.store_name,
    '大类': log.scoring_items?.category,
    '考核具体项': log.scoring_items?.sub_category,
    '标准分': log.scoring_items?.score_impact,
    '实际扣分': log.final_score
  }))

  const worksheet = XLSX.utils.json_to_sheet(exportData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Performance")
  XLSX.writeFile(workbook, `考核台账_${startDate.value}_${endDate.value}.xlsx`)
}

// 编辑/更新/删除逻辑
const openEdit = (log) => {
  editingLog.value = JSON.parse(JSON.stringify(log))
  isModalOpen.value = true
}

const handleUpdate = async () => {
  const { error } = await supabase
    .from('performance_logs')
    .update({ final_score: editingLog.value.final_score })
    .eq('id', editingLog.value.id)

  if (!error) {
    alert('✅ 修改成功')
    isModalOpen.value = false
    loadLogs()
  }
}

const handleDelete = async () => {
  if (!confirm('⚠️ 确定要删除吗？这将影响薪酬核算数据。')) return
  const { error } = await supabase
    .from('performance_logs')
    .delete()
    .eq('id', editingLog.value.id)

  if (!error) {
    alert('🗑️ 记录已移除')
    isModalOpen.value = false
    loadLogs()
  }
}

onMounted(loadLogs)
</script>

