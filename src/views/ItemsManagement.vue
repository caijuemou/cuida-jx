<template>
  <div class="max-w-6xl mx-auto p-4 md:p-6 space-y-4 md:space-y-6 pb-24">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-gray-100 gap-4">
      <div>
        <h1 class="text-xl md:text-2xl font-black text-gray-900 tracking-tight">考核标准项维护</h1>
        <p class="text-gray-400 mt-1 text-xs md:text-sm font-medium">支持 Excel 导入或手动维护</p>
      </div>
      <div class="flex flex-wrap gap-2 w-full md:w-auto">
        <input type="file" ref="fileInput" class="hidden" accept=".xlsx, .xls" @change="handleExcelUpload" />
        
        <button @click="triggerUpload('staff')" class="flex-1 md:flex-none px-4 py-2.5 bg-emerald-600 text-white rounded-xl md:rounded-2xl font-bold shadow-lg shadow-emerald-100 text-xs flex items-center justify-center">
          <FileSpreadsheetIcon class="mr-1.5" :size="16"/> 员工标准上传
        </button>
        
        <button @click="triggerUpload('manager')" class="flex-1 md:flex-none px-4 py-2.5 bg-rose-600 text-white rounded-xl md:rounded-2xl font-bold shadow-lg shadow-rose-100 text-xs flex items-center justify-center">
          <UserIcon class="mr-1.5" :size="16"/> 店长标准上传
        </button>

        <button @click="openAddModal" class="w-full md:w-auto px-4 py-2.5 bg-indigo-600 text-white rounded-xl md:rounded-2xl font-bold shadow-lg shadow-indigo-100 text-xs flex items-center justify-center">
          <PlusIcon class="mr-1.5" :size="16"/> 新增标准
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white p-3 md:p-4 rounded-[1.2rem] md:rounded-[1.5rem] shadow-sm border border-gray-100">
      <div class="relative md:col-span-2">
        <input v-model="searchQuery" type="text" placeholder="搜索关键词..." 
          class="w-full pl-10 pr-10 py-2.5 bg-gray-50 border-none rounded-lg md:rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all" />
        <SearchIcon class="absolute left-3 top-2.5 text-gray-300" :size="16" />
        <button v-if="searchQuery" @click="searchQuery = ''" class="absolute right-3 top-2.5 text-gray-300">
          <XIcon :size="16" />
        </button>
      </div>
      
      <div class="relative">
        <select v-model="selectedCategory" 
          class="w-full pl-9 pr-8 py-2.5 bg-gray-50 border-none rounded-lg md:rounded-xl text-sm font-black text-gray-600 appearance-none focus:ring-2 focus:ring-indigo-500">
          <option value="全部大类">全部大类</option>
          <option v-for="cat in categories" :key="cat.name" :value="cat.name">
            {{ cat.role === 'manager' ? '店长 ' : '员工' }} {{ cat.name }}
          </option>
        </select>
        <FilterIcon class="absolute left-3 top-2.5 text-gray-300" :size="16" />
      </div>
    </div>

    <div class="bg-white rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
      <div class="overflow-x-auto"> <table class="w-full text-left border-collapse min-w-[600px]"> <thead>
            <tr class="bg-gray-50/50">
              <th class="p-4 md:p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">考核大类</th>
              <th class="p-4 md:p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">考核项详情</th>
              <th class="p-4 md:p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">分值</th>
              <th class="p-4 md:p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">适用</th>
              <th class="p-4 md:p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right sticky right-0 bg-gray-50/50 shadow-[-10px_0_10px_-5px_rgba(0,0,0,0.05)]">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-for="item in filteredItems" :key="item.id" class="hover:bg-indigo-50/30 transition-colors">
              <td class="p-4 md:p-5">
                <button @click="selectedCategory = item.category" 
                  class="px-2.5 py-1 bg-white border border-indigo-100 text-indigo-600 rounded-full text-[10px] font-black whitespace-nowrap">
                  {{ item.category }}
                </button>
              </td>
              <td class="p-4 md:p-5 text-sm font-black text-gray-800 leading-snug">
                {{ item.sub_category }}
              </td>
              <td class="p-4 md:p-5 text-center font-black text-rose-500 text-base md:text-lg">{{ item.score_impact }}</td>
              <td class="p-4 md:p-5 text-center">
                <span :class="item.applicable_to === 'manager' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'" 
                  class="px-1.5 py-0.5 border rounded text-[9px] font-bold whitespace-nowrap">
                  {{ item.applicable_to === 'manager' ? '店长' : '员工' }}
                </span>
              </td>
              <td class="p-4 md:p-5 text-right space-x-1 sticky right-0 bg-white group-hover:bg-indigo-50/1 transition-colors shadow-[-10px_0_10px_-5px_rgba(0,0,0,0.05)] md:shadow-none">
                <div class="flex justify-end gap-1">
                  <button @click="openEditModal(item)" class="p-2 text-gray-300 hover:text-indigo-600 rounded-lg transition-all"><Edit2Icon :size="16" /></button>
                  <button @click="handleDelete(item.id)" class="p-2 text-gray-300 hover:text-rose-600 rounded-lg transition-all"><Trash2Icon :size="16" /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="filteredItems.length === 0" class="p-12 text-center text-gray-300 font-bold text-sm">
        未找到匹配的考核标准
      </div>
    </div>

    <div v-if="showModal" class="fixed inset-0 z-[120] flex items-end md:items-center justify-center px-0 md:px-4">
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="closeModal"></div>
      <div class="relative bg-white w-full max-w-md rounded-t-[2rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden">
        <div class="p-6 md:p-8">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-xl font-black text-gray-900">{{ isEditing ? '编辑标准' : '新增标准' }}</h3>
            <button @click="closeModal" class="p-2 bg-gray-50 rounded-xl text-gray-400"><XIcon :size="20" /></button>
          </div>
          <div class="space-y-4">
			<div>
			  <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">考核大类</label>
			  <div class="relative group">
				<input 
				  v-model="form.category" 
				  type="text" 
				  @focus="showSuggestions = true"
				  @blur="setTimeout(() => showSuggestions = false, 200)"
				  placeholder="输入或选择大类..."
				  class="w-full mt-1 pl-4 pr-16 py-2.5 bg-gray-50 border-none rounded-xl font-black text-sm focus:ring-2 focus:ring-indigo-500 transition-all" 
				/>
				
				<div class="absolute right-2 top-1.5 flex items-center gap-1">
				  <button 
					v-if="form.category" 
					@click.stop="form.category = ''"
					class="p-1.5 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
					type="button"
				  >
					<XIcon :size="14" />
				  </button>
				  
				  <div v-if="form.category" class="w-[1px] h-4 bg-gray-200"></div>
				  
				  <div class="p-1.5 text-gray-300">
					<ChevronDownIcon :size="16" />
				  </div>
				</div>

				<div v-if="showSuggestions && filteredCategories.length > 0" 
				  class="absolute z-[150] w-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
				  <div v-for="cat in filteredCategories" :key="cat.name"
					@mousedown="selectCategory(cat)"
					class="px-4 py-2.5 hover:bg-indigo-50 cursor-pointer flex justify-between items-center transition-colors">
					<span class="text-sm font-bold text-gray-700">{{ cat.name }}</span>
					<span :class="cat.role === 'manager' ? 'text-rose-500 bg-rose-50' : 'text-emerald-500 bg-emerald-50'"
					  class="text-[9px] px-2 py-0.5 rounded-lg font-black uppercase tracking-tighter">
					  {{ cat.role === 'manager' ? '店长专项' : '员工通用' }}
					</span>
				  </div>
				</div>
			  </div>
			</div>
            <div>
              <label class="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">内容详情</label>
              <textarea v-model="form.sub_category" rows="3" class="w-full mt-1 px-4 py-2.5 bg-gray-50 border-none rounded-xl font-bold text-sm focus:ring-2 focus:ring-indigo-500 resize-none"></textarea>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">最高分值</label>
                <input v-model.number="form.score_impact" type="number" class="w-full mt-1 px-4 py-2.5 bg-gray-50 border-none rounded-xl font-bold text-sm" />
              </div>
              <div>
                <label class="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">适用对象</label>
                <select v-model="form.applicable_to" class="w-full mt-1 px-4 py-2.5 bg-gray-50 border-none rounded-xl font-bold text-sm">
                  <option value="staff">员工</option>
                  <option value="manager">店长</option>
                </select>
              </div>
            </div>
            <button @click="saveItem" :disabled="modalLoading" class="w-full py-3.5 mt-2 bg-indigo-600 text-white rounded-2xl font-black text-base shadow-xl active:scale-95 transition-all">
              {{ modalLoading ? '提交中...' : '确认保存' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed,watch } from 'vue'
import { supabase } from '../composables/useSupabase'
import { PlusIcon, Edit2Icon, Trash2Icon, FileSpreadsheetIcon, Loader2Icon, UserIcon, SearchIcon, FilterIcon, ChevronDownIcon, XIcon } from 'lucide-vue-next'
import * as XLSX from 'xlsx'

const items = ref([])
const isUploading = ref(false)
const fileInput = ref(null)
const currentUploadRole = ref('staff')
const searchQuery = ref('')
const selectedCategory = ref('全部大类')
const showModal = ref(false)
const isEditing = ref(false)
const modalLoading = ref(false)
const editingId = ref(null)
const initialForm = { category: '', sub_category: '', score_impact: 5, applicable_to: 'staff' }
const form = ref({ ...initialForm })
const showSuggestions = ref(false)

// 实时过滤下拉建议列表（根据用户输入的内容过滤）
const filteredCategories = computed(() => {
  if (!form.value.category) return categories.value
  return categories.value.filter(c => 
    c.name.toLowerCase().includes(form.value.category.toLowerCase())
  )
})

// 选择后的逻辑：填充内容 + 自动判断身份
const selectCategory = (cat) => {
  form.value.category = cat.name
  form.value.applicable_to = cat.role // 自动同步适用对象
  showSuggestions.value = false
}

// 智能监听：即使手动打字，只要匹配到了已有类目，也自动切身份
watch(() => form.value.category, (newVal) => {
  const match = categories.value.find(c => c.name === newVal)
  if (match) {
    form.value.applicable_to = match.role
  }
})

const categories = computed(() => {
  const map = new Map()
  items.value.forEach(item => {
    if (!map.has(item.category)) map.set(item.category, item.applicable_to)
  })
  return Array.from(map.entries()).map(([name, role]) => ({ name, role }))
    .sort((a, b) => (a.role === 'manager' ? 1 : -1))
})

const filteredItems = computed(() => {
  return items.value.filter(item => {
    const matchesSearch = !searchQuery.value || 
      item.sub_category.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
      item.category.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesCategory = selectedCategory.value === '全部大类' || item.category === selectedCategory.value
    return matchesSearch && matchesCategory
  })
})

const loadData = async () => {
  const { data } = await supabase.from('scoring_items').select('*').eq('is_active', true)
    .order('applicable_to', { ascending: false }).order('category')
  items.value = data || []
}

const saveItem = async () => {
  if (!form.value.category || !form.value.sub_category) return alert('请填写完整')
  modalLoading.value = true
  try {
    const payload = { ...form.value, is_active: true }
    const { error } = isEditing.value 
      ? await supabase.from('scoring_items').update(payload).eq('id', editingId.value)
      : await supabase.from('scoring_items').insert([payload])
    if (error) throw error
    closeModal(); loadData()
  } catch (err) { alert('失败') } finally { modalLoading.value = false }
}

const openAddModal = () => { isEditing.value = false; form.value = { ...initialForm }; showModal.value = true }
const openEditModal = (item) => { isEditing.value = true; editingId.value = item.id; form.value = { ...item }; showModal.value = true }
const closeModal = () => { showModal.value = false }
const triggerUpload = (role) => { currentUploadRole.value = role; fileInput.value.click() }

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
      
      // 1. 数据转换
      const formatted = jsonData.map(row => ({
        category: row['考核大类']?.toString().trim() || '未分类',
        sub_category: row['考核项']?.toString().trim() || '未命名',
        score_impact: Number(row['分值']) || 0,
        applicable_to: currentUploadRole.value, // staff 或 manager
        is_active: true,
        // 这里不需要传 id，数据库会根据下面的 onConflict 自动匹配
      }))

      if (formatted.length === 0) throw new Error('Excel 内容为空')

      // 2. 执行 Upsert (增量同步)
      const { error } = await supabase
        .from('scoring_items')
        .upsert(formatted, { 
          // 这里的字段必须和第一步 SQL 创建的约束完全对应
          onConflict: 'category, sub_category, applicable_to' 
        })

      if (error) throw error
      
      alert(`成功同步 ${formatted.length} 条考核标准（已自动去重/更新）`)
      await loadData() // 刷新列表展示
      
    } catch (err) {
      console.error('导入失败详情:', err)
      alert('导入失败: ' + (err.message || '请检查 Excel 格式'))
    } finally {
      isUploading.value = false
      if (fileInput.value) fileInput.value.value = '' // 清空 input 方便下次上传
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
