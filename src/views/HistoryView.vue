<template>
  <div class="max-w-6xl mx-auto p-4 md:p-6 pb-24 space-y-6">
    <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 space-y-4">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 class="text-2xl font-black text-gray-900 tracking-tight">考核记录台账</h1>
          <div class="flex items-center gap-2 mt-1">
            <p class="text-gray-400 text-[10px] font-medium italic uppercase">Performance Audit Trail</p>
            <span class="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] rounded-lg font-bold">符合条件: {{ filteredLogs.length }} 条</span>
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
        <input v-model="filterQuery" type="text" placeholder="搜索姓名、工号、门店或考核内容..." 
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
            <th class="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">考核项目/描述</th>
            <th class="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">分值</th>
            <th class="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">通知状态</th>
            <th class="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr v-for="log in filteredLogs" :key="log.id" class="hover:bg-slate-50/80 transition-colors group">
            <td class="p-5 text-sm font-bold text-gray-500">{{ log.score_date }}</td>
            <td class="p-5">
              <div class="font-black text-gray-800">{{ log.staff_name }}</div>
              <div class="text-[10px] text-gray-400 font-bold">ID: {{ log.staff_v_id }}</div>
            </td>
            <td class="p-5 text-sm font-bold text-indigo-600">{{ log.store_name }}</td>
            <td class="p-5">
              <div class="text-sm font-bold text-gray-800">{{ log.sub_category }}</div>
              <div class="text-[10px] text-gray-400 uppercase font-bold">{{ log.category }}</div>
            </td>
            <td class="p-5 text-center">
              <span class="text-lg font-black text-rose-500">{{ log.final_score }}</span>
            </td>
            <td class="p-5">
              <div class="flex items-center gap-2">
                <span v-if="log.sync_status === 'sent'" class="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] rounded-lg font-black">
                  <CheckCircleIcon :size="12" /> 已通知
                </span>
                <span v-else-if="log.sync_status === 'failed'" class="flex items-center gap-1 px-2 py-1 bg-rose-50 text-rose-600 text-[10px] rounded-lg font-black">
                  <AlertCircleIcon :size="12" /> 发送失败
                </span>
                <span v-else class="px-2 py-1 bg-gray-100 text-gray-400 text-[10px] rounded-lg font-black">未发送</span>
                
                <button v-if="log.sync_status === 'failed' || !log.sync_status" 
                        @click="retryPush(log)"
                        :disabled="retryingId === log.id"
                        class="p-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-300 transition-colors shadow-sm shadow-indigo-100"
                        title="重新推送通知">
                  <RotateCwIcon :size="12" :class="{'animate-spin': retryingId === log.id}" />
                </button>
              </div>
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
      <div v-for="log in filteredLogs" :key="log.id" class="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
        <div class="flex justify-between items-start mb-3">
          <div>
            <div class="text-xs font-black text-indigo-500 uppercase tracking-tighter">{{ log.store_name }}</div>
            <div class="text-lg font-black text-gray-900">{{ log.staff_name }}</div>
          </div>
          <div class="text-right">
            <div class="text-2xl font-black text-rose-500">{{ log.final_score }}分</div>
            <div class="mt-1 flex justify-end gap-2">
              <span v-if="log.sync_status === 'sent'" class="text-[10px] font-black text-emerald-500 italic">● 已推送</span>
              <button v-if="log.sync_status === 'failed'" @click="retryPush(log)" class="text-[10px] font-black text-rose-500 underline">重试推送</button>
            </div>
          </div>
        </div>
        <div class="bg-gray-50 p-3 rounded-2xl text-sm font-bold text-gray-600 mb-4">
          <div class="text-[10px] text-gray-400">{{ log.category }}</div>
          {{ log.sub_category }}
        </div>
        <div class="flex justify-between items-center">
          <span class="text-[10px] font-bold text-gray-400 italic">{{ log.score_date }}</span>
          <button @click="openEdit(log)" class="px-4 py-2 bg-slate-900 text-white text-xs font-black rounded-xl shadow-lg">编辑记录</button>
        </div>
      </div>
    </div>

    <div v-if="filteredLogs.length === 0" class="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
      <div class="text-gray-200 mb-4 flex justify-center"><ClipboardXIcon :size="64" /></div>
      <p class="text-gray-400 font-bold">未找到符合条件的考核记录</p>
    </div>

    <div v-if="isModalOpen" class="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-black text-gray-900">修改考核信息</h3>
          <button @click="isModalOpen = false" class="p-2 bg-gray-100 rounded-full text-gray-400 hover:bg-gray-200 transition-colors"><XIcon :size="20"/></button>
        </div>
        <div class="space-y-6">
          <div class="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
            <div class="text-xs text-indigo-400 font-black uppercase mb-1">被考核人</div>
            <div class="font-black text-indigo-900 text-lg">{{ editingLog.staff_name }}</div>
            <div class="text-sm text-indigo-700/70 font-bold mt-2 italic">{{ editingLog.sub_category }}</div>
          </div>
          <div>
            <label class="block text-xs font-black text-gray-400 uppercase mb-2 ml-1">修正分值</label>
            <input v-model="editingLog.final_score" type="text" 
                   class="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl font-black text-2xl text-rose-500 transition-all outline-none" />
          </div>
          <div class="grid grid-cols-2 gap-3 pt-2">
            <button @click="handleDelete" class="py-4 bg-rose-50 text-rose-600 rounded-2xl font-black text-sm hover:bg-rose-100 transition-colors">删除这条记录</button>
            <button @click="handleUpdate" class="py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-colors">保存所有修改</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../composables/useSupabase'
import { 
  SearchIcon, Edit3Icon, XIcon, ClipboardXIcon, 
  DownloadIcon, CheckCircleIcon, AlertCircleIcon, RotateCwIcon 
} from 'lucide-vue-next'
import * as XLSX from 'xlsx'

const logs = ref([])
const filterQuery = ref('')
const isModalOpen = ref(false)
const editingLog = ref(null)
const retryingId = ref(null) 
const staffTree = ref({})    

// --- 日期处理逻辑 ---
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

// --- 数据加载 ---
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
      sub_category:description,
      sync_status
    `)
    .order('record_date', { ascending: false })
  
  if (error) {
    console.error("加载记录失败:", error.message)
  } else {
    logs.value = data || []
  }
}

// 加载职员数据用于补发通知时查找店长
const loadStaffData = async () => {
  const { data } = await supabase.from('staff_cache').select('*').eq('is_active', true)
  const tree = {}
  data?.forEach(s => {
    if (!tree[s.dept_name]) tree[s.dept_name] = []
    tree[s.dept_name].push(s)
  })
  staffTree.value = tree
}

// --- 补发通知核心逻辑 ---
const retryPush = async (log) => {
  if (retryingId.value) return
  retryingId.value = log.id

  try {
    // 1. 查找抄送店长 ID
    let ccVId = null
    const staffInDept = staffTree.value[log.store_name] || []
    const manager = staffInDept.find(s => 
      (s.job_title?.includes('店长') || s.job_title?.includes('店经理')) && 
      s.xft_user_id !== log.staff_v_id
    )
    if (manager) ccVId = manager.xft_user_id

    // 2. 调用后端 Edge Function
    const { error: invokeError } = await supabase.functions.invoke('xft-send-msg', {
      body: { 
        target_user_id: log.staff_v_id, 
        target_name: log.staff_name,
        item_name: log.sub_category,
        score: log.final_score,
        manager_v_id: ccVId 
      } 
    })

    if (invokeError) throw new Error("推送失败")

    // 3. 成功后同步更新数据库状态
    await supabase.from('perf_records').update({ sync_status: 'sent' }).eq('id', log.id)

    // 4. UI 局部更新
    const item = logs.value.find(l => l.id === log.id)
    if (item) item.sync_status = 'sent'
    
    alert('🚀 通知补发成功！')
  } catch (err) {
    alert('❌ 补发失败，请联系系统管理员')
  } finally {
    retryingId.value = null
  }
}

// --- 过滤逻辑 ---
const filteredLogs = computed(() => {
  return logs.value.filter(l => {
    const inDate = l.score_date >= startDate.value && l.score_date <= endDate.value
    const q = filterQuery.value.toLowerCase()
    const inQuery = !q || 
      l.staff_name?.toLowerCase().includes(q) || 
      l.store_name?.toLowerCase().includes(q) ||
      l.sub_category?.toLowerCase().includes(q)
    return inDate && inQuery
  })
})

// --- Excel 导出 ---
const exportToExcel = () => {
  const exportData = filteredLogs.value.map(log => ({
    '日期': log.score_date,
    '姓名': log.staff_name,
    '工号': log.staff_v_id,
    '门店': log.store_name,
    '项目详情': log.sub_category,
    '分值': log.final_score,
    '发送状态': log.sync_status === 'sent' ? '已送达' : '未成功'
  }))
  const ws = XLSX.utils.json_to_sheet(exportData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Records")
  XLSX.writeFile(wb, `考核记录_${startDate.value}.xlsx`)
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
    alert('保存成功')
    isModalOpen.value = false
    loadLogs()
  }
}

const handleDelete = async () => {
  if (!confirm('确认要永久删除这条考核记录吗？')) return
  const { error } = await supabase.from('perf_records').delete().eq('id', editingLog.value.id)
  if (!error) {
    isModalOpen.value = false
    loadLogs()
  }
}

onMounted(() => {
  loadLogs()
  loadStaffData()
})
</script>
