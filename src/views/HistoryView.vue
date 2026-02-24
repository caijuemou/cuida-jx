<template>
  <div class="max-w-6xl mx-auto p-4 md:p-6 pb-24 space-y-6">
    <!-- 页面标题和操作区 -->
    <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 space-y-4">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 class="text-2xl font-black text-gray-900 tracking-tight">考核记录台账</h1>
          <div class="flex items-center gap-2 mt-1">
            <p class="text-gray-400 text-[10px] font-medium italic uppercase">Performance Audit Trail</p>
            <span class="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] rounded-lg font-bold">符合条件: {{ filteredLogs.length }} 条</span>
            <span v-if="roleLabel" class="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] rounded-lg font-bold border border-amber-100">{{ roleLabel }}</span>
          </div>
        </div>
        
        <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <!-- 快速日期选择 -->
          <div class="flex bg-gray-100 p-1 rounded-xl">
            <button @click="setToThisMonth" class="px-3 py-1.5 text-[10px] font-black rounded-lg transition-all"
                    :class="isThisMonth ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400'">本月</button>
            <button @click="setToLastMonth" class="px-3 py-1.5 text-[10px] font-black rounded-lg transition-all"
                    :class="isLastMonth ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400'">上月</button>
          </div>

          <!-- 自定义日期范围 -->
          <div class="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
            <input v-model="startDate" type="date" class="bg-transparent border-none text-xs font-black focus:ring-0 p-0 text-gray-600" />
            <span class="text-gray-300 text-xs">-</span>
            <input v-model="endDate" type="date" class="bg-transparent border-none text-xs font-black focus:ring-0 p-0 text-gray-600" />
          </div>

          <!-- 导出按钮 -->
          <button @click="exportToExcel" :disabled="filteredLogs.length === 0"
                  class="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black flex items-center gap-2 hover:bg-emerald-700 transition-all disabled:bg-gray-200 shadow-lg shadow-emerald-100">
            <DownloadIcon :size="16" /> 导出报表
          </button>
        </div>
      </div>

      <!-- 搜索框 -->
      <div class="relative w-full">
        <input v-model="filterQuery" type="text" :placeholder="searchPlaceholder"
               class="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl text-sm font-bold transition-all focus:ring-0" />
        <SearchIcon class="absolute left-4 top-4 text-gray-300" :size="20" />
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] shadow-sm border border-gray-100">
      <div class="animate-spin text-indigo-600 mb-4">
        <LoaderIcon :size="48" />
      </div>
      <p class="text-sm text-gray-500 font-black">正在加载记录...</p>
    </div>

    <!-- 错误提示 -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-[2rem] p-6 text-center">
      <ExclamationTriangleIcon class="mx-auto h-12 w-12 text-red-400 mb-4" />
      <h3 class="text-lg font-black text-red-800 mb-2">加载失败</h3>
      <p class="text-sm text-red-600 mb-4">{{ error }}</p>
      <button @click="loadLogs" class="px-4 py-2 bg-red-600 text-white rounded-xl font-black hover:bg-red-700 transition-all">
        重试
      </button>
    </div>

    <!-- 无数据提示 -->
    <div v-else-if="filteredLogs.length === 0" class="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-12 text-center">
      <ClipboardListIcon class="mx-auto h-12 w-12 text-gray-300 mb-4" />
      <p class="text-lg font-bold text-gray-400">暂无考核记录</p>
      <p class="text-sm text-gray-400 mt-2">当前筛选条件下没有找到数据</p>
    </div>

    <!-- 数据表格/卡片 -->
    <div v-else>
      <!-- PC端表格 -->
      <div class="hidden md:block bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50/50">
              <th class="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">考核日期</th>
              <th class="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">被考核人</th>
              <th class="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">所属门店</th>
              <th class="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">考核详情</th>
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
                <div class="text-[10px] text-gray-400 font-bold italic">发起人: {{ log.starter_name }}</div>
              </td>
              <td class="p-5 text-sm font-bold text-indigo-600">{{ log.store_name }}</td>
              <td class="p-5">
                <div class="text-sm font-bold text-gray-800 leading-tight">{{ log.sub_category }}</div>
                <div class="text-[10px] text-gray-400 font-bold mt-1">标准分值: {{ log.standard_score || '--' }} 分</div>
              </td>
              <td class="p-5 text-center font-black text-rose-500 text-lg">
                扣 {{ log.final_score }}
              </td>
              <td class="p-5">
                <div class="flex items-center gap-2">
                  <span v-if="log.sync_status === 'sent'" class="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] rounded-lg font-black flex items-center gap-1">
                    <CheckCircleIcon :size="12" /> 已送达
                  </span>
                  <span v-else-if="log.sync_status === 'failed'" class="px-2 py-1 bg-rose-50 text-rose-600 text-[10px] rounded-lg font-black flex items-center gap-1">
                    <AlertCircleIcon :size="12" /> 失败
                  </span>
                  <button v-if="log.sync_status === 'failed' && log.starter_id === myVNumber"
                          @click="retryPush(log)"
                          class="p-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                    <RotateCwIcon :size="12" :class="{'animate-spin': retryingId === log.id}" />
                  </button>
                </div>
              </td>
              <td class="p-5 text-right">
                <button v-if="log.starter_id === myVNumber"
                        @click="openEdit(log)"
                        class="p-2 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                  <Edit3Icon :size="18" />
                </button>
                <span v-else class="text-[10px] text-gray-300 font-bold italic">只读模式</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 移动端卡片列表 -->
      <div class="md:hidden space-y-4">
        <div v-for="log in filteredLogs" :key="log.id" class="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
          <div class="flex justify-between items-start mb-3">
            <div>
              <div class="text-xs font-black text-indigo-500 uppercase">{{ log.store_name }}</div>
              <div class="text-lg font-black text-gray-900">{{ log.staff_name }}</div>
            </div>
            <div class="text-2xl font-black text-rose-500">扣{{ log.final_score }}分</div>
          </div>
          <div class="text-sm font-bold text-gray-600 mb-1">{{ log.sub_category }}</div>
          <div class="text-[10px] text-gray-400 font-bold mb-2 italic">标准分值: {{ log.standard_score || '--' }}分</div>
          
          <div class="text-[10px] text-gray-400 font-medium mb-3 tracking-wider">日期: {{ log.score_date }} · 发起: {{ log.starter_name }}</div>
          <div class="flex justify-end items-center border-t border-gray-50 pt-3">
            <button v-if="log.starter_id === myVNumber"
                    @click="openEdit(log)"
                    class="px-6 py-2 bg-slate-900 text-white text-xs font-black rounded-xl">编辑</button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 编辑弹窗 -->
    <div v-if="isModalOpen" class="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-black text-gray-900">修改考核记录</h3>
          <button @click="isModalOpen = false" class="p-2 bg-gray-100 rounded-full text-gray-400"><XIcon :size="20"/></button>
        </div>
        <div class="space-y-6">
          <div class="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
            <div class="text-xs text-indigo-400 font-black mb-1 italic">考核内容</div>
            <div class="font-black text-indigo-900 leading-tight">{{ editingLog.sub_category }}</div>
            <div class="flex justify-between items-center mt-3 pt-2 border-t border-indigo-100/50">
              <span class="text-xs text-indigo-300 font-bold">针对: {{ editingLog.staff_name }}</span>
              <span class="text-xs text-indigo-400 font-black">标准分: {{ editingLog.standard_score || '--' }}分</span>
            </div>
          </div>
          <div>
            <label class="block text-xs font-black text-gray-400 uppercase mb-2 ml-1">分值修正</label>
            <div class="relative">
              <span class="absolute left-5 top-1/2 -translate-y-1/2 text-rose-500 font-black text-xl">扣</span>
              <input v-model="editingLog.final_score" type="number"
                     class="w-full pl-12 pr-5 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl font-black text-2xl text-rose-500" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3 pt-2">
            <button @click="handleDelete" class="py-4 bg-rose-50 text-rose-600 rounded-2xl font-black text-sm hover:bg-rose-100 transition-colors">删除记录</button>
            <button @click="handleUpdate" class="py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-lg hover:bg-indigo-700 transition-colors">保存修改</button>
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
  SearchIcon, Edit3Icon, XIcon, DownloadIcon,
  CheckCircleIcon, AlertCircleIcon, RotateCwIcon,
  LoaderIcon, ExclamationTriangleIcon, ClipboardListIcon
} from 'lucide-vue-next'
import * as XLSX from 'xlsx'
import { isStoreManager } from '@/utils/permissions'

const logs = ref([])
const filterQuery = ref('')
const loading = ref(false)
const error = ref('')
const isModalOpen = ref(false)
const editingLog = ref(null)
const retryingId = ref(null)
const staffTree = ref({})

// 获取用户信息
const me = JSON.parse(localStorage.getItem('user_info') || '{}')
const myVNumber = me.xft_user_id
const myDept = me.dept_name
const myJob = me.job_title || ''

// --- 权限/搜索提示 ---
const roleLabel = computed(() => {
  if (myDept.includes('管理组') || myDept.includes('后勤')) return '管理组视图 (全) '
  if (myJob.includes('店长') || myJob.includes('店经理')) return `门店视图 (${myDept})`
  return '个人绩效汇总'
})

const searchPlaceholder = computed(() => {
  if (myDept.includes('管理组')) return "搜索姓名、门店、或考核内容..."
  if (myJob.includes('店长') || myJob.includes('店经理')) return "搜索本店员工姓名..."
  return "在我的记录中搜索内容..."
})

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

// --- 数据加载 (含字段补齐与权限) ---
const loadLogs = async () => {
  loading.value = true
  error.value = ''
  
  try {
    let query = supabase.from('perf_records').select('*')

    // 1. 明确角色身份
    const isOffice = myDept.includes('管理组') ||
                     myDept.includes('后勤') ||
                     myDept.includes('人力') ||
                     myDept.includes('财务')
    
    const isManager = myJob.includes('店长') ||
                      myJob.includes('店经理') ||
                      myJob.includes('负责人')

    // 2. 分层施加过滤条件
    if (isOffice) {
      // 管理组：不做任何过滤，查询全部
      console.log("权限级别：管理组 - 全量查看");
    } else if (isManager) {
      // 店经理/店长：只能查看自己门店的员工记录
      query = query.or(`target_dept_name.eq."${myDept}",starter_id.eq."${myVNumber}"`)
      console.log(`权限级别：店经理 - 查看门店: ${myDept}`);
    } else {
      // 普通员工：只能查看被考核人 ID 是自己的记录
      query = query.eq('target_user_id', myVNumber)
      console.log(`权限级别：员工 - 仅查看个人`);
    }

    const { data, error: queryError } = await query.order('record_date', { ascending: false })
    
    if (queryError) throw new Error('数据加载失败: ' + queryError.message)
    
    // 关键映射逻辑
    logs.value = (data || []).map(item => ({
      id: item.id,
      final_score: item.score_value,
      score_date: item.record_date,
      store_name: item.target_dept_name,
      staff_name: item.target_name,
      staff_v_id: item.target_user_id,
      category: item.category_label,
      sub_category: item.description,
      standard_score: item.score_impact,
      sync_status: item.sync_status,
      starter_id: item.starter_id,
      starter_name: item.starter_name
    }))
  } catch (err) {
    console.error("加载失败:", err)
    error.value = err.message || '数据加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

const loadStaffData = async () => {
  try {
    const { data } = await supabase.from('staff_cache').select('*').eq('is_active', true)
    const tree = {}
    data?.forEach(s => {
      if (!tree[s.dept_name]) tree[s.dept_name] = []
      tree[s.dept_name].push(s)
    })
    staffTree.value = tree
  } catch (err) {
    console.error('员工数据加载失败:', err)
  }
}

// --- 补发消息 ---
const retryPush = async (log) => {
  if (retryingId.value) return
  retryingId.value = log.id
  try {
    let ccVId = null
    const staffInDept = staffTree.value[log.store_name] || []
    const manager = staffInDept.find(s =>
      isStoreManager(s) &&
      s.xft_user_id !== log.staff_v_id
    )
    if (manager) ccVId = manager.xft_user_id

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

    await supabase.from('perf_records').update({ sync_status: 'sent' }).eq('id', log.id)
    const item = logs.value.find(l => l.id === log.id)
    if (item) item.sync_status = 'sent'
    alert('🚀 补发成功')
  } catch (err) {
    alert('❌ 补发失败: ' + err.message)
  } finally {
    retryingId.value = null
  }
}

// --- 搜索过滤 ---
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

// --- 修改逻辑 ---
const openEdit = (log) => {
  editingLog.value = { ...log }
  isModalOpen.value = true
}

const handleUpdate = async () => {
  if (editingLog.value.starter_id !== myVNumber) {
    alert('无权修改他人发起的记录')
    return
  }
  
  if (!editingLog.value.final_score || editingLog.value.final_score <= 0) {
    alert('请输入有效的扣分值')
    return
  }
  
  const { error } = await supabase
    .from('perf_records')
    .update({ score_value: String(editingLog.value.final_score) })
    .eq('id', editingLog.value.id)

  if (!error) {
    alert('✅ 修改已保存')
    isModalOpen.value = false
    loadLogs()
  } else {
    alert('❌ 修改失败: ' + error.message)
  }
}

const handleDelete = async () => {
  if (editingLog.value.starter_id !== myVNumber) {
    alert('无权删除他人发起的记录')
    return
  }
  
  if (!confirm('确定要永久删除这条考核记录吗？此操作不可恢复。')) return
  
  const { error } = await supabase.from('perf_records').delete().eq('id', editingLog.value.id)
  if (!error) {
    isModalOpen.value = false
    loadLogs()
    alert('✅ 删除成功')
  } else {
    alert('❌ 删除失败: ' + error.message)
  }
}

// --- 导出 ---
const exportToExcel = () => {
  if (filteredLogs.value.length === 0) {
    alert('没有可导出的数据')
    return
  }
  
  try {
    const exportData = filteredLogs.value.map(log => ({
      '日期': log.score_date,
      '姓名': log.staff_name,
      '门店': log.store_name,
      '考核详情': log.sub_category,
      '标准分值': log.standard_score,
      '实际扣分': log.final_score,
      '发起人': log.starter_name,
      '通知状态': log.sync_status === 'sent' ? '已送达' : '未送达'
    }))
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "绩效考核台账")
    const fileName = `绩效考核台账_${startDate.value}_至_${endDate.value}.xlsx`
    XLSX.writeFile(wb, fileName)
  } catch (err) {
    alert('导出失败: ' + err.message)
    console.error('导出错误:', err)
  }
}

// 监听日期变化，自动刷新数据
watch([startDate, endDate], () => {
  loadLogs()
})

onMounted(() => {
  loadLogs()
  loadStaffData()
})
</script>




