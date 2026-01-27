<template>
  <div class="max-w-6xl mx-auto p-6 space-y-6 pb-24">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 gap-4">
      <div>
        <h1 class="text-3xl font-black text-gray-900 tracking-tight">指标库维护</h1>
        <p class="text-gray-400 mt-1 font-medium">支持 Excel (.xlsx) 批量导入</p>
      </div>
      <div class="flex gap-3">
        <input type="file" ref="fileInput" class="hidden" accept=".xlsx, .xls" @change="handleExcelUpload" />
        
        <button @click="triggerUpload('staff')" class="px-5 py-3 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center text-sm">
          <FileSpreadsheetIcon class="mr-2" :size="18"/> 员工指标上传
        </button>
        
        <button @click="triggerUpload('manager')" class="px-5 py-3 bg-rose-600 text-white rounded-2xl font-bold shadow-lg shadow-rose-100 hover:bg-rose-700 transition-all flex items-center text-sm">
          <UserIcon class="mr-2" :size="18"/> 店长指标上传
        </button>

        <button @click="openAddModal" class="px-5 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center text-sm">
          <PlusIcon class="mr-2" :size="18"/> 新增指标
        </button>
      </div>
    </div>

    <div class="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-gray-50/50">
            <th class="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">考核大类</th>
            <th class="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">考核项详情</th>
            <th class="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">分值</th>
            <th class="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">适用对象</th>
            <th class="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr v-for="item in items" :key="item.id" class="hover:bg-indigo-50/30 transition-colors group">
            <td class="p-5">
              <span class="px-3 py-1 bg-white border border-indigo-100 text-indigo-600 rounded-full text-[11px] font-black">{{ item.category }}</span>
            </td>
            <td class="p-5 font-bold text-gray-800">{{ item.sub_category }}</td>
            <td class="p-5 text-center font-black text-rose-500 text-lg">{{ item.score_impact }}</td>
            <td class="p-5 text-center">
              <span :class="item.applicable_to === 'manager' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'" 
                class="px-2 py-1 border rounded-lg text-[10px] font-bold">
                {{ item.applicable_to === 'manager' ? '店长专项' : '通用项' }}
              </span>
            </td>
            <td class="p-5 text-right space-x-1">
              <button @click="openEditModal(item)" class="p-2 text-gray-300 hover:text-indigo-600 rounded-xl transition-all"><Edit2Icon :size="18" /></button>
              <button @click="handleDelete(item.id)" class="p-2 text-gray-300 hover:text-rose-600 rounded-xl transition-all"><Trash2Icon :size="18" /></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="isUploading" class="fixed inset-0 bg-white/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center">
      <div class="animate-spin text-emerald-600 mb-4"><Loader2Icon :size="48" /></div>
      <p class="font-black text-gray-600">正在同步 {{ currentUploadRole === 'manager' ? '店长' : '员工' }} 指标...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../composables/useSupabase'
import { PlusIcon, Edit2Icon, Trash2Icon, FileSpreadsheetIcon, Loader2Icon, UserIcon } from 'lucide-vue-next'
import * as XLSX from 'xlsx'

const items = ref([])
const isUploading = ref(false)
const fileInput = ref(null)
const currentUploadRole = ref('staff')

const loadData = async () => {
  const { data } = await supabase.from('scoring_items').select('*').eq('is_active', true).order('applicable_to', { ascending: false }).order('category')
  items.value = data || []
}

const triggerUpload = (role) => {
  currentUploadRole.value = role
  fileInput.value.click()
}

const handleExcelUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return
  isUploading.value = true
  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]])
      
      const formattedData = jsonData.map(row => ({
        category: row['考核大类'] || '未分类',
        sub_category: row['考核项'] || '未命名项目',
        score_impact: Number(row['分值']) || 0,
        applicable_to: currentUploadRole.value,
        is_active: true
      }))

      const { error } = await supabase.from('scoring_items').upsert(formattedData)
      if (error) throw error
      alert(`✅ 导入成功！已归类为：${currentUploadRole.value === 'manager' ? '店长专项' : '员工指标'}`)
      loadData()
    } catch (err) {
      alert('上传失败：' + err.message)
    } finally {
      isUploading.value = false
      event.target.value = ''
    }
  }
  reader.readAsArrayBuffer(file)
}

const handleDelete = async (id) => {
  if (confirm('确认删除？')) {
    await supabase.from('scoring_items').update({ is_active: false }).eq('id', id)
    loadData()
  }
}

onMounted(loadData)
</script>