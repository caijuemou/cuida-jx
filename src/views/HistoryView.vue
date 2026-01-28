<template>
  <div class="max-w-6xl mx-auto p-4 md:p-6 pb-24 space-y-6">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 gap-4">
      <div>
        <h1 class="text-2xl font-black text-gray-900 tracking-tight">考核记录台账</h1>
        <p class="text-gray-400 text-xs mt-1 font-medium italic">History Performance Audit Trail</p>
      </div>
      <div class="relative w-full md:w-64">
        <input v-model="filterQuery" type="text" placeholder="搜索姓名或门店..." 
               class="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500" />
        <SearchIcon class="absolute left-3 top-2.5 text-gray-300" :size="18" />
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
            <th class="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">分值 (标准/实际)</th>
            <th class="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">管理</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr v-for="log in filteredLogs" :key="log.id" class="hover:bg-slate-50/80 transition-colors group">
            <td class="p-5 text-sm font-bold text-gray-500">{{ log.score_date }}</td>
            <td class="p-5 font-black text-gray-800">{{ log.staff_cache?.name || '未知' }}</td>
            <td class="p-5 text-sm font-bold text-indigo-600">{{ log.store_name }}</td>
            <td class="p-5">
              <div class="text-sm font-bold text-gray-800">{{ log.scoring_items?.sub_category }}</div>
              <div class="text-[10px] text-gray-400 uppercase">{{ log.scoring_items?.category }}</div>
            </td>
            <td class="p-5 text-center">
              <span class="text-xs font-bold text-gray-300">{{ log.scoring_items?.score_impact }} / </span>
              <span class="text-lg font-black text-rose-500">{{ log.final_score }}</span>
            </td>
            <td class="p-5 text-right space-x-2">
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

    <div v-if="filteredLogs.length === 0" class="text-center py-20">
      <div class="text-gray-200 mb-4 flex justify-center"><ClipboardXIcon :size="64" /></div>
      <p class="text-gray-400 font-bold">未找到相关扣分记录</p>
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
import { SearchIcon, Edit3Icon, XIcon, ClipboardXIcon } from 'lucide-vue-next'

const logs = ref([])
const filterQuery = ref('')
const isModalOpen = ref(false)
const editingLog = ref(null)

// 加载历史数据
const loadLogs = async () => {
  const { data, error } = await supabase
    .from('performance_logs')
    .select(`
      id,
      final_score,
      score_date,
      store_name,
      staff_cache ( name ),
      scoring_items ( category, sub_category, score_impact )
    `)
    .order('created_at', { ascending: false })
  
  if (!error) logs.value = data
}

// 搜索过滤
const filteredLogs = computed(() => {
  if (!filterQuery.value) return logs.value
  const q = filterQuery.value.toLowerCase()
  return logs.value.filter(l => 
    l.staff_cache?.name?.toLowerCase().includes(q) || 
    l.store_name?.toLowerCase().includes(q)
  )
})

// 开启编辑
const openEdit = (log) => {
  editingLog.value = JSON.parse(JSON.stringify(log)) // 深拷贝，防止直接改动列表
  isModalOpen.value = true
}

// 保存修改
const handleUpdate = async () => {
  const { error } = await supabase
    .from('performance_logs')
    .update({ final_score: editingLog.value.final_score })
    .eq('id', editingLog.value.id)

  if (!error) {
    alert('修改成功')
    isModalOpen.value = false
    loadLogs()
  }
}

// 删除记录
const handleDelete = async () => {
  if (!confirm('确定要永久删除这条考核记录吗？此操作不可撤销。')) return
  
  const { error } = await supabase
    .from('performance_logs')
    .delete()
    .eq('id', editingLog.value.id)

  if (!error) {
    alert('记录已删除')
    isModalOpen.value = false
    loadLogs()
  }
}

onMounted(loadLogs)
</script>