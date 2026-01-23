<template>
  <div class="max-w-5xl mx-auto pb-24 space-y-8">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-400 font-medium">考核标准总数</p>
          <p class="text-2xl font-black text-gray-800">{{ items.length }} 项</p>
        </div>
        <div class="p-3 bg-blue-50 text-blue-600 rounded-2xl"><BookOpenIcon :size="24" /></div>
      </div>
      </div>

    <div class="flex flex-col md:flex-row gap-4 justify-between items-end">
      <div class="flex gap-2">
        <button @click="openAddModal" class="px-6 py-3 bg-gray-900 text-white rounded-2xl text-sm font-bold flex items-center shadow-lg hover:bg-gray-800 transition-all">
          <PlusIcon :size="18" class="mr-2" /> 新增指标
        </button>
        <label class="px-6 py-3 bg-emerald-600 text-white rounded-2xl text-sm font-bold flex items-center shadow-lg hover:bg-emerald-700 cursor-pointer transition-all">
          <FileUpIcon :size="18" class="mr-2" /> 导入 Excel
          <input type="file" class="hidden" @change="handleFileUpload" accept=".xlsx, .xls" />
        </label>
      </div>
    </div>

    <div class="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <table class="w-full text-left border-collapse">
        <thead class="bg-gray-50 border-b border-gray-100 text-gray-400 text-xs font-black uppercase tracking-widest">
          <tr>
            <th class="px-6 py-4">分类/指标</th>
            <th class="px-6 py-4 text-center">分值</th>
            <th class="px-6 py-4">描述</th>
            <th class="px-6 py-4 text-right">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr v-for="item in items" :key="item.id" class="hover:bg-gray-50/50 transition-colors group">
            <td class="px-6 py-4">
              <span class="text-[10px] text-indigo-500 font-bold px-2 py-0.5 bg-indigo-50 rounded-full">{{ item.category }}</span>
              <div class="text-gray-800 font-bold mt-1">{{ item.sub_category }}</div>
            </td>
            <td class="px-6 py-4 text-center">
              <span :class="item.score_impact < 0 ? 'text-rose-500 bg-rose-50' : 'text-emerald-500 bg-emerald-50'" class="px-3 py-1 rounded-full font-black text-xs">
                {{ item.score_impact > 0 ? '+' : '' }}{{ item.score_impact }}
              </span>
            </td>
            <td class="px-6 py-4">
              <p class="text-sm text-gray-400 line-clamp-1 italic">{{ item.description || '-' }}</p>
            </td>
            <td class="px-6 py-4 text-right space-x-2">
              <button @click="editItem(item)" class="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                <EditIcon :size="18" />
              </button>
              <button @click="deleteItem(item.id)" class="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                <Trash2Icon :size="18" />
              </button>
            </td>
          </tr>
          <tr v-if="items.length === 0">
            <td colspan="4" class="py-20 text-center text-gray-400">暂无数据，请尝试导入或新增</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl">
        <h3 class="text-xl font-black text-gray-800 mb-6">{{ isEdit ? '修改考核项' : '新增考核项' }}</h3>
        <div class="space-y-4">
          <div>
            <label class="text-xs font-bold text-gray-400 uppercase">大类 (如：考勤类)</label>
            <input v-model="form.category" type="text" class="w-full mt-1 p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label class="text-xs font-bold text-gray-400 uppercase">细项指标</label>
            <input v-model="form.sub_category" type="text" class="w-full mt-1 p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label class="text-xs font-bold text-gray-400 uppercase">分值影响 (正数加分，负数扣分)</label>
            <input v-model.number="form.score_impact" type="number" class="w-full mt-1 p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label class="text-xs font-bold text-gray-400 uppercase">详细描述</label>
            <textarea v-model="form.description" class="w-full mt-1 p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500" rows="3"></textarea>
          </div>
        </div>
        <div class="mt-8 flex gap-3">
          <button @click="showModal = false" class="flex-1 py-3 text-sm font-bold text-gray-400 hover:bg-gray-50 rounded-2xl">取消</button>
          <button @click="saveItem" class="flex-1 py-3 text-sm font-bold bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100">保存提交</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../composables/useSupabase'
import * as XLSX from 'xlsx'
import {
  PlusIcon, FileUpIcon, EditIcon,
  Trash2Icon, BookOpenIcon
} from 'lucide-vue-next'

const items = ref([])
const showModal = ref(false)
const isEdit = ref(false)
const form = ref({ category: '', sub_category: '', score_impact: 0, description: '' })
const currentId = ref(null)

// --- 加载数据 ---
const loadData = async () => {
  const { data, error } = await supabase.from('scoring_items').select('*').order('category')
  if (!error) items.value = data || []
}

// --- 手动新增/编辑 ---
const openAddModal = () => {
  isEdit.value = false
  form.value = { category: '', sub_category: '', score_impact: 0, description: '' }
  showModal.value = true
}

const editItem = (item) => {
  isEdit.value = true
  currentId.value = item.id
  form.value = { ...item }
  showModal.value = true
}

const saveItem = async () => {
  if (isEdit.value) {
    await supabase.from('scoring_items').update(form.value).eq('id', currentId.value)
  } else {
    await supabase.from('scoring_items').insert([form.value])
  }
  showModal.value = false
  loadData()
}

// --- 删除 ---
const deleteItem = async (id) => {
  if (confirm('确定要删除这项考核标准吗？')) {
    await supabase.from('scoring_items').delete().eq('id', id)
    loadData()
  }
}

// --- Excel 导入 ---
const handleFileUpload = (e) => {
  const file = e.target.files[0]
  const reader = new FileReader()
  reader.onload = async (event) => {
    const data = new Uint8Array(event.target.result)
    const workbook = XLSX.read(data, { type: 'array' })
    const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]])

    const formattedData = jsonData.map(row => ({
      category: row['考核大类'] || '未分类',
      sub_category: row['考核项'],
      score_impact: parseFloat(row['分值']),
      description: row['描述'] || ''
    }))

    const { error } = await supabase.from('scoring_items').insert(formattedData)
    if (error) alert('导入失败：' + error.message)
    else loadData()
  }
  reader.readAsArrayBuffer(file)
}

onMounted(loadData)
</script>
