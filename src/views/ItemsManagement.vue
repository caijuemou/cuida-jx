<template>
  <div class="max-w-6xl mx-auto p-6 space-y-6 pb-24">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 gap-4">
      <div>
        <h1 class="text-3xl font-black text-gray-900 tracking-tight">考核标准维护</h1>
        <p class="text-gray-400 mt-1 font-medium">支持 Excel (.xlsx) 批量导入或手动维护</p>
      </div>
      <div class="flex gap-3">
        <input type="file" ref="fileInput" class="hidden" accept=".xlsx, .xls" @change="handleExcelUpload" />
        
        <button @click="triggerUpload('staff')" class="px-5 py-3 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center text-sm">
          <FileSpreadsheetIcon class="mr-2" :size="18"/> 员工标准上传
        </button>
        
        <button @click="triggerUpload('manager')" class="px-5 py-3 bg-rose-600 text-white rounded-2xl font-bold shadow-lg shadow-rose-100 hover:bg-rose-700 transition-all flex items-center text-sm">
          <UserIcon class="mr-2" :size="18"/> 店长标准上传
        </button>

        <button @click="openAddModal" class="px-5 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center text-sm">
          <PlusIcon class="mr-2" :size="18"/> 新增考核标准
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-[1.5rem] shadow-sm border border-gray-100">
      <div class="relative md:col-span-2">
        <input v-model="searchQuery" type="text" placeholder="搜索考核大类、考核项详情..." 
          class="w-full pl-12 pr-12 py-3 bg-gray-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-gray-300" />
        <SearchIcon class="absolute left-4 top-3 text-gray-300" :size="18" />
        <button v-if="searchQuery" @click="searchQuery = ''" class="absolute right-4 top-3 text-gray-300 hover:text-indigo-600">
          <XIcon :size="18" />
        </button>
      </div>
      
      <div class="relative">
        <select v-model="selectedCategory" 
          class="w-full pl-10 pr-10 py-3 bg-gray-50 border-none rounded-xl text-sm font-black text-gray-600 appearance-none focus:ring-2 focus:ring-indigo-500 transition-all">
          <option value="全部大类">全部大类</option>
          <option v-for="cat in categories" :key="cat.name" :value="cat.name">
            {{ cat.role === 'manager' ? '店长 ' : '🟢' }} {{ cat.name }}
          </option>
        </select>
        <FilterIcon class="absolute left-4 top-3 text-gray-300" :size="18" />
        <ChevronDownIcon class="absolute right-4 top-3.5 text-gray-300 pointer-events-none" :size="16" />
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
          <tr v-for="item in filteredItems" :key="item.id" class="hover:bg-indigo-50/30 transition-colors group">
            <td class="p-5">
              <button @click="selectedCategory = item.category" 
                class="px-3 py-1 bg-white border border-indigo-100 text-indigo-600 rounded-full text-[11px] font-black hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95 block w-fit">
                {{ item.category }}
              </button>
            </td>
            <td class="p-5 font-bold text-gray-800 leading-relaxed">{{ item.sub_category }}</td>
            <td class="p-5 text-center font-black text-rose-500 text-lg">{{ item.score_impact }}</td>
            <td class="p-5 text-center">
              <span :class="item.applicable_to === 'manager' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'" 
                class="px-2 py-1 border rounded-lg text-[10px] font-bold">
                {{ item.applicable_to === 'manager' ? '店长专项' : '员工项' }}
              </span>
            </td>
            <td class="p-5 text-right space-x-1">
              <button @click="openEditModal(item)" class="p-2 text-gray-300 hover:text-indigo-600 rounded-xl transition-all"><Edit2Icon :size="18" /></button>
              <button @click="handleDelete(item.id)" class="p-2 text-gray-300 hover:text-rose-600 rounded-xl transition-all"><Trash2Icon :size="18" /></button>
            </td>
          </tr>
          <tr v-if="filteredItems.length === 0">
            <td colspan="5" class="p-20 text-center text-gray-300 font-bold">没有匹配的考核标准</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showModal" class="fixed inset-0 z-[120] flex items-center justify-center px-4">
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="closeModal"></div>
      <div class="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div class="p-8">
          <div class="flex justify-between items-center mb-8">
            <h3 class="text-2xl font-black text-gray-900">{{ isEditing ? '编辑标准' : '新增标准' }}</h3>
            <button @click="closeModal" class="p-2 bg-gray-50 rounded-xl text-gray-400 hover:text-gray-600"><XIcon :size="20" /></button>
          </div>
          <div class="space-y-6">
            <div>
              <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">考核大类</label>
              <input v-model="form.category" type="text" placeholder="例如：服务质量" class="w-full mt-1 px-5 py-3 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 transition-all" />
            </div>
            <div>
              <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">考核项详情</label>
              <textarea v-model="form.sub_category" rows="3" placeholder="具体考核描述..." class="w-full mt-1 px-5 py-3 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 transition-all resize-none"></textarea>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">标准分值</label>
                <input v-model.number="form.score_impact" type="number" class="w-full mt-1 px-5 py-3 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 transition-all" />
              </div>
              <div>
                <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">适用对象</label>
                <select v-model="form.applicable_to" class="w-full mt-1 px-5 py-3 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 transition-all appearance-none">
                  <option value="staff">员工项</option>
                  <option value="manager">店长专项</option>
                </select>
              </div>
            </div>
            <button @click="saveItem" :disabled="modalLoading" class="w-full py-4 mt-4 bg-indigo-600 text-white rounded-3xl font-black text-lg shadow-xl shadow-indigo-100 active:scale-95 transition-all disabled:bg-gray-200">
              {{ modalLoading ? '提交中...' : '确认保存' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="isUploading" class="fixed inset-0 bg-white/80 backdrop-blur-sm z-[200] flex flex-col items-center justify-center">
      <div class="animate-spin text-emerald-600 mb-4"><Loader2Icon :size="48" /></div>
      <p class="font-black text-gray-600 italic">正在同步云端标准库...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../composables/useSupabase'
import { 
  PlusIcon, Edit2Icon, Trash2Icon, FileSpreadsheetIcon, 
  Loader2Icon, UserIcon, SearchIcon, FilterIcon, 
  ChevronDownIcon, XIcon 
} from 'lucide-vue-next'
import * as XLSX from 'xlsx'

// --- 状态定义 ---
const items = ref([])
const isUploading = ref(false)
const fileInput = ref(null)
const currentUploadRole = ref('staff')

// 联动控制状态
const searchQuery = ref('')
const selectedCategory = ref('全部大类')

// 弹窗表单状态
const showModal = ref(false)
const isEditing = ref(false)
const modalLoading = ref(false)
const editingId = ref(null)
const initialForm = { category: '', sub_category: '', score_impact: 5, applicable_to: 'staff' }
const form = ref({ ...initialForm })

// --- 核心联动逻辑 ---
const categories = computed(() => {
  const map = new Map()
  items.value.forEach(item => {
    if (!map.has(item.category)) map.set(item.category, item.applicable_to)
  })
  return Array.from(map.entries()).map(([name, role]) => ({ name, role }))
    .sort((a, b) => (a.role === 'manager' ? -1 : 1))
})

const filteredItems = computed(() => {
  return items.value.filter(item => {
    const matchesSearch = !searchQuery.value || 
      item.sub_category.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
      item.category.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (item.applicable_to === 'manager' ? '店长' : '员工').includes(searchQuery.value)
    
    const matchesCategory = selectedCategory.value === '全部大类' || item.category === selectedCategory.value
    return matchesSearch && matchesCategory
  })
})

// --- 数据处理方法 ---
const loadData = async () => {
  const { data } = await supabase.from('scoring_items').select('*').eq('is_active', true)
    .order('applicable_to', { ascending: false }).order('category')
  items.value = data || []
}

// 保存逻辑 (新增/编辑)
const saveItem = async () => {
  if (!form.value.category || !form.value.sub_category) return alert('内容不能为空')
  modalLoading.value = true
  try {
    const payload = { ...form.value, is_active: true }
    const { error } = isEditing.value 
      ? await supabase.from('scoring_items').update(payload).eq('id', editingId.value)
      : await supabase.from('scoring_items').insert([payload])
    
    if (error) throw error
    closeModal()
    loadData()
  } catch (err) { alert('操作失败: ' + err.message) }
  finally { modalLoading.value = false }
}

// --- 弹窗控制 ---
const openAddModal = () => {
  isEditing.value = false
  form.value = { ...initialForm }
  showModal.value = true
}

const openEditModal = (item) => {
  isEditing.value = true
  editingId.value = item.id
  form.value = { ...item }
  showModal.value = true
}

const closeModal = () => { showModal.value = false }

// --- 其他操作 ---
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
      const formatted = jsonData.map(row => ({
        category: row['考核大类'] || '未分类',
        sub_category: row['考核项'] || '未命名',
        score_impact: Number(row['分值']) || 0,
        applicable_to: currentUploadRole.value,
        is_active: true
      }))
      await supabase.from('scoring_items').upsert(formatted)
      loadData()
    } catch (err) { alert('导入失败') }
    finally { isUploading.value = false; event.target.value = '' }
  }
  reader.readAsArrayBuffer(file)
}

const handleDelete = async (id) => {
  if (confirm('确定移除此考核项？')) {
    await supabase.from('scoring_items').update({ is_active: false }).eq('id', id)
    loadData()
  }
}

onMounted(loadData)
</script>