<template>
  <div class="max-w-6xl mx-auto p-6 space-y-6 pb-24">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 gap-4">
      <div>
        <h1 class="text-3xl font-black text-gray-900 tracking-tight">指标库维护</h1>
        <p class="text-gray-400 mt-1 font-medium">支持 Excel (.xlsx) 批量导入</p>
      </div>
      <div class="flex gap-3">
        <input type="file" ref="fileInput" class="hidden" accept=".xlsx, .xls" @change="handleExcelUpload" />
        <button @click="$refs.fileInput.click()" class="px-5 py-3 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center">
          <FileSpreadsheetIcon class="mr-2" :size="18"/> 上传 Excel
        </button>
        <button @click="openAddModal" class="px-5 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center">
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
      <p class="font-black text-gray-600">正在解析并同步 Excel 数据...</p>
    </div>

    <div v-if="showModal" class="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
        </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../composables/useSupabase'
import { PlusIcon, Edit2Icon, Trash2Icon, FileSpreadsheetIcon, Loader2Icon } from 'lucide-vue-next'
import * as XLSX from 'xlsx' // 导入 Excel 处理库

const items = ref([])
const showModal = ref(false)
const isEdit = ref(false)
const isUploading = ref(false)
const fileInput = ref(null)
const form = ref({ id: null, category: '', sub_category: '', score_impact: 0 })

// 加载数据
const loadData = async () => {
  const { data } = await supabase
    .from('scoring_items')
    .select('*')
    .eq('is_active', true) // 核心：只加载激活状态的指标
    .order('category');
  items.value = data || [];
};

// 核心：处理 Excel 上传
const handleExcelUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return

  isUploading.value = true
  const reader = new FileReader()

  reader.onload = async (e) => {
    try {
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      
      // 将 Excel 转为 JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      // 字段映射逻辑 (匹配你图片中的表头)
      const formattedData = jsonData.map(row => ({
        category: row['考核大类'] || '未分类',
        score_impact: Number(row['分值']) || 0,
        sub_category: row['考核项'] || '未命名项目'
      }))

      if (formattedData.length === 0) throw new Error('Excel 文件内容为空')

      // 写入数据库 (upsert 模式：如果大类和考核项完全一致则更新，否则新增)
      const { error } = await supabase.from('scoring_items').upsert(formattedData)
      
      if (error) throw error
      
      alert(`成功导入 ${formattedData.length} 条考核标准！`)
      loadData()
    } catch (err) {
      console.error(err)
      alert('上传失败：' + err.message)
    } finally {
      isUploading.value = false
      event.target.value = '' // 清空 input
    }
  }

  reader.readAsArrayBuffer(file)
}

// 其余增删改逻辑... (参考上一个回答)
const handleDelete = async (id) => {
  if (confirm('确认删除该项标准？')) {
    try {
      const { error } = await supabase
        .from('scoring_items')
        .update({ is_active: false }) // 逻辑删除：只改状态，不删数据
        .eq('id', id);

      if (error) throw error;
      
      // 重新加载数据
      await loadData(); 
    } catch (err) {
      alert('操作失败：' + err.message);
    }
  }
};

const openAddModal = () => {
  isEdit.value = false
  form.value = { id: null, category: '', sub_category: '', score_impact: 2 }
  showModal.value = true
}

const handleSave = async () => {
  const payload = { category: form.value.category, sub_category: form.value.sub_category, score_impact: form.value.score_impact }
  if (isEdit.value) await supabase.from('scoring_items').update(payload).eq('id', form.value.id)
  else await supabase.from('scoring_items').insert([payload])
  showModal.value = false
  loadData()
}

onMounted(loadData)
</script>