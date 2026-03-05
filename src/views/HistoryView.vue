<template>
  <div class="max-w-6xl mx-auto p-4 md:p-6 pb-24 space-y-6">
    <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 space-y-4">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 class="text-2xl font-black text-gray-900 tracking-tight">考核历史记录</h1>
          <div class="flex items-center gap-2 mt-1">
            <span class="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] rounded-lg font-bold">符合条件: {{ filteredLogs.length }} 条</span>
            <span v-if="roleLabel" class="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] rounded-lg font-bold border border-amber-100">{{ roleLabel }}</span>
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
        <input v-model="filterQuery" type="text" placeholder="搜索姓名、门店、考核项或具体描述..."
               class="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl text-sm font-bold transition-all focus:ring-0" />
        <SearchIcon class="absolute left-4 top-4 text-gray-300" :size="20" />
      </div>
    </div>

    <div v-if="loading" class="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] shadow-sm">
      <div class="animate-spin text-indigo-600 mb-4"><LoaderIcon :size="48" /></div>
      <p class="text-sm text-gray-500 font-black">正在读取实时数据...</p>
    </div>

    <div v-else-if="filteredLogs.length === 0" class="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-12 text-center">
      <ClipboardListIcon class="mx-auto h-12 w-12 text-gray-300 mb-4" />
      <p class="text-lg font-bold text-gray-400">当前筛选区间无记录</p>
    </div>

    <div v-else>
      <div class="hidden md:block bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50/50">
              <th class="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">考核日期</th>
              <th class="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">对象信息</th>
              <th class="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest w-1/3">考核项目与描述</th>
              <th class="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">扣分</th>
              <th class="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">薪福通状态</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-for="log in filteredLogs" :key="log.id" class="hover:bg-slate-50/80 transition-colors">
              <td class="p-5 text-sm font-bold text-gray-500">{{ log.score_date }}</td>
              <td class="p-5">
                <div class="font-black text-gray-800">{{ log.staff_name }}</div>
                <div class="text-[10px] text-indigo-500 font-bold italic">{{ log.store_name }}</div>
              </td>
              <td class="p-5">
                <div class="text-sm font-bold text-gray-800 leading-tight">{{ log.sub_category }}</div>
                <div v-if="log.detail_reason" class="text-xs text-gray-500 mt-2 bg-gray-50 p-2.5 rounded-xl italic border-l-4 border-indigo-200">
                  {{ log.detail_reason }}
                </div>
              </td>
              <td class="p-5 text-center font-black text-rose-500 text-lg">-{{ log.final_score }}</td>
              
              <td class="p-5">
                <div v-if="log.proc_inst_id" class="flex flex-col">
                  <span class="text-emerald-600 font-black text-[10px] flex items-center gap-1">
                    <CheckCircleIcon :size="12" /> 已同步
                  </span>
                  <span class="text-[9px] text-gray-400 font-mono mt-0.5">ID: {{ log.proc_inst_id }}</span>
                </div>
                <div v-else-if="log.sync_status === 'failed'" class="flex flex-col">
                   <span class="text-rose-500 font-black text-[10px] flex items-center gap-1">
                    <AlertCircleIcon :size="12" /> 同步失败
                  </span>
                </div>
                <div v-else class="text-amber-500 font-black text-[10px] animate-pulse flex items-center gap-1">
                  <RotateCwIcon :size="12" class="animate-spin" /> 处理中...
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="md:hidden space-y-4">
        <div v-for="log in filteredLogs" :key="log.id" class="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden">
          <div class="flex justify-between items-start mb-4 relative z-10">
            <div>
              <div class="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">{{ log.store_name }}</div>
              <div class="text-xl font-black text-gray-900">{{ log.staff_name }}</div>
            </div>
            <div class="bg-rose-50 px-3 py-1 rounded-xl">
              <span class="text-rose-500 font-black text-lg">-{{ log.final_score }}</span>
            </div>
          </div>

          <div class="space-y-4 relative z-10">
            <p class="text-sm font-bold text-gray-700 leading-snug">{{ log.sub_category }}</p>
            
            <div v-if="log.detail_reason" class="bg-slate-50 p-4 rounded-2xl">
              <p class="text-sm text-gray-500 font-medium leading-relaxed italic">" {{ log.detail_reason }} "</p>
            </div>

            <div class="flex flex-col gap-2 pt-2 border-t border-gray-50 mt-4">
               <div class="text-[10px] text-gray-400 font-bold">日期: {{ log.score_date }} · 发起人: {{ log.starter_name }}</div>
               
               <div class="flex items-center gap-2">
                 <span v-if="log.proc_inst_id" class="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-lg">
                    ID: {{ log.proc_inst_id }}
                 </span>
                 <span v-else-if="log.sync_status === 'failed'" class="px-2 py-1 bg-rose-50 text-rose-600 text-[10px] font-black rounded-lg">
                    同步异常
                 </span>
                 <span v-else class="px-2 py-1 bg-amber-50 text-amber-600 text-[10px] font-black rounded-lg animate-pulse">
                    正在同步至薪福通
                 </span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { supabase } from '../composables/useSupabase'
import {
  SearchIcon, DownloadIcon, CheckCircleIcon, AlertCircleIcon, 
  RotateCwIcon, LoaderIcon, ClipboardListIcon
} from 'lucide-vue-next'
import * as XLSX from 'xlsx'

const logs = ref([])
const filterQuery = ref('')
const loading = ref(false)
const error = ref('')

const me = JSON.parse(localStorage.getItem('user_info') || '{}')
const myVNumber = me.xft_user_id
const myDept = String(me.dept_name || '')
const myJob = me.job_title || ''

const roleLabel = computed(() => {
  if (myDept.includes('管理组') || myDept.includes('后勤')) return '权限: 全公司'
  if (myJob.includes('店长')) return `权限: 门店管理`
  return '权限: 个人绩效'
})

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

const loadLogs = async () => {
  loading.value = true
  try {
    let query = supabase.from('perf_records').select('*')

    // 权限过滤逻辑
    const isOffice = ['管理组', '后勤', '人力', '行政', '总办'].some(kw => myDept.includes(kw))
    const isManager = ['店长', '店经理', '负责人'].some(kw => myJob.includes(kw))

    if (!isOffice) {
      if (isManager) {
        query = query.or(`target_dept_name.eq."${myDept}",starter_id.eq."${myVNumber}"`)
      } else {
        query = query.eq('target_user_id', myVNumber)
      }
    }

    const { data, error: queryError } = await query.order('record_date', { ascending: false })
    if (queryError) throw queryError

    logs.value = (data || []).map(item => ({
      id: item.id,
      final_score: item.score_value,
      score_date: item.record_date,
      store_name: item.target_dept_name,
      staff_name: item.target_name,
      sub_category: item.description,
      detail_reason: item.detail_reason,
      sync_status: item.sync_status,
      proc_inst_id: item.proc_inst_id, // 核心：获取流程单号
      starter_name: item.starter_name
    }))
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const filteredLogs = computed(() => {
  return logs.value.filter(l => {
    const inDate = l.score_date >= startDate.value && l.score_date <= endDate.value
    const q = filterQuery.value.toLowerCase()
    const inQuery = !q || 
      l.staff_name?.toLowerCase().includes(q) || 
      l.store_name?.toLowerCase().includes(q) || 
      l.sub_category?.toLowerCase().includes(q) ||
      l.detail_reason?.toLowerCase().includes(q)
    return inDate && inQuery
  })
})

const exportToExcel = () => {
  const exportData = filteredLogs.value.map(log => ({
    '日期': log.score_date,
    '姓名': log.staff_name,
    '门店/部门': log.store_name,
    '考核项目': log.sub_category,
    '具体描述': log.detail_reason || '',
    '扣分': log.final_score,
    '发起人': log.starter_name,
    '薪福通ID': log.proc_inst_id || '未同步'
  }))
  const ws = XLSX.utils.json_to_sheet(exportData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "绩效考核台账")
  XLSX.writeFile(wb, `绩效考核台账_${startDate.value}.xlsx`)
}

watch([startDate, endDate], loadLogs)
onMounted(loadLogs)
</script>
