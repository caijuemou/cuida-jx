<template>
  <div class="pb-20">
    <h2 class="text-2xl font-bold mb-6 text-gray-800">考核项管理</h2>

    <div class="p-4 bg-white border border-gray-100 rounded-xl shadow-sm mb-6">
      <h3 class="font-semibold text-gray-700 mb-3">批量导入/更新考核项</h3>
      <input
        type="file"
        @change="handleFileUpload"
        accept=".xlsx, .xls, .csv"
        class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
      <p class="text-sm text-gray-500 mt-2">
        请上传Excel/CSV文件，列名需严格匹配：**考核大类, 考核项, 分值, 描述**。
      </p>
      <div v-if="uploading" class="mt-3 text-blue-600 flex items-center">
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>上传中...</span>
      </div>
    </div>

    <div class="p-4 bg-white border border-gray-100 rounded-xl shadow-sm mb-6">
      <h3 class="font-semibold text-gray-700 mb-3">新增考核项</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <input v-model="newItem.category" type="text" placeholder="考核大类" class="p-2 border rounded-lg">
        <input v-model="newItem.sub_category" type="text" placeholder="考核项" class="p-2 border rounded-lg">
        <input v-model="newItem.score_impact" type="number" placeholder="分值 (负数表示扣分)" class="p-2 border rounded-lg">
        <input v-model="newItem.description" type="text" placeholder="描述 (可选)" class="p-2 border rounded-lg col-span-full">
      </div>
      <button
        @click="addNewItem"
        :disabled="!newItem.category || !newItem.sub_category || !newItem.score_impact || addingItem"
        class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300"
      >
        {{ addingItem ? '添加中...' : '添加考核项' }}
      </button>
    </div>

    <div class="bg-white border border-gray-100 rounded-xl shadow-sm overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">考核大类</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">考核项</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">分值</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">描述</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-if="loadingItems" class="text-center text-gray-500"><td colspan="5" class="py-4">加载中...</td></tr>
          <tr v-else-if="items.length === 0" class="text-center text-gray-500"><td colspan="5" class="py-4">暂无考核项</td></tr>
          <tr v-for="item in items" :key="item.id">
            <template v-if="editingItem?.id === item.id">
              <td class="px-6 py-4 whitespace-nowrap"><input v-model="editingItem.category" class="p-1 border rounded-md w-full"></td>
              <td class="px-6 py-4 whitespace-nowrap"><input v-model="editingItem.sub_category" class="p-1 border rounded-md w-full"></td>
              <td class="px-6 py-4 whitespace-nowrap"><input v-model="editingItem.score_impact" type="number" class="p-1 border rounded-md w-full"></td>
              <td class="px-6 py-4 whitespace-nowrap"><input v-model="editingItem.description" class="p-1 border rounded-md w-full"></td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button @click="saveEditedItem" :disabled="savingEdit" class="text-green-600 hover:text-green-900 mr-2 disabled:opacity-50">
                  {{ savingEdit ? '保存中...' : '保存' }}
                </button>
                <button @click="cancelEdit" class="text-gray-600 hover:text-gray-900">取消</button>
              </td>
            </template>
            <template v-else>
              <td class="px-6 py-4 whitespace-nowrap">{{ item.category }}</td>
              <td class="px-6 py-4 whitespace-nowrap">{{ item.sub_category }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm" :class="item.score_impact < 0 ? 'text-red-600' : 'text-green-600'">
                {{ item.score_impact }}
              </td>
              <td class="px-6 py-4 text-sm text-gray-500">{{ item.description }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button @click="startEdit(item)" class="text-blue-600 hover:text-blue-900 mr-2">编辑</button>
                <button @click="deleteItem(item.id)" :disabled="deletingItem === item.id" class="text-red-600 hover:text-red-900 disabled:opacity-50">
                  {{ deletingItem === item.id ? '删除中...' : '删除' }}
                </button>
              </td>
            </template>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-8 p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
      <h3 class="font-semibold text-gray-700 mb-3">人员数据管理</h3>
      <button
        @click="syncStaffData"
        :disabled="syncingStaff"
        class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-300"
      >
        {{ syncingStaff ? '同步中...' : '立即同步薪福通人员数据' }}
      </button>
      <p v-if="lastStaffSync" class="text-xs text-gray-500 mt-2">上次同步: {{ new Date(lastStaffSync).toLocaleString() }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../composables/useSupabase'
import * as XLSX from 'xlsx'

const items = ref([])
const loadingItems = ref(false)
const uploading = ref(false)
const addingItem = ref(false)
const editingItem = ref(null)
const savingEdit = ref(false)
const deletingItem = ref(null)
const syncingStaff = ref(false)
const lastStaffSync = ref(null)

const newItem = ref({
  category: '',
  sub_category: '',
  score_impact: null,
  description: ''
})

// --- 数据获取 ---
const fetchScoringItems = async () => {
  loadingItems.value = true
  const { data, error } = await supabase
    .from('scoring_items')
    .select('*')
    .order('category', { ascending: true })
    .order('sub_category', { ascending: true })

  if (error) {
    console.error('Error fetching scoring items:', error.message)
    alert('加载考核项失败，请检查网络或联系管理员。')
    items.value = []
  } else {
    items.value = data || []
  }
  loadingItems.value = false
}

// --- Excel 导入 ---
const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  uploading.value = true
  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const json = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
        header: ['考核大类', '考核项', '分值', '描述'] // 指定列名，匹配你的模板
      })

      const itemsToInsert = json.slice(1).map(row => ({ // 假设第一行是表头
        category: row['考核大类'] || '未分类',
        sub_category: row['考核项'] || '未知项',
        score_impact: parseFloat(row['分值']) || 0,
        description: row['描述'] || '',
        // creator: '管理员 (待薪福通OAuth集成)', // 导入时填操作人
        // modifier: '管理员 (待薪福通OAuth集成)'
      })).filter(item => item.sub_category !== '未知项'); // 过滤掉无效行

      if (itemsToInsert.length === 0) {
        alert('未从文件中读取到有效数据，请检查Excel格式。')
        uploading.value = false
        return
      }

      // 使用 upsert 策略，如果 category+sub_category 组合存在则更新，否则插入
      // 注意：这里用 category 和 sub_category 作为唯一标识，需要确保这两项组合是唯一的
      // 或者在数据库中为这两列添加 UNIQUE 约束
      const { error } = await supabase
        .from('scoring_items')
        .upsert(itemsToInsert, { onConflict: ['category', 'sub_category'] }); // 指定冲突键

      if (error) {
        console.error('批量导入失败:', error.message);
        alert('批量导入失败：' + error.message);
      } else {
        alert('考核项批量导入/更新成功！');
        fetchScoringItems(); // 重新加载列表
      }
    } catch (error) {
      console.error('文件解析或导入失败:', error.message);
      alert('文件解析或导入失败，请确保文件格式正确。');
    } finally {
      uploading.value = false;
      event.target.value = ''; // 清空文件选择器
    }
  };
  reader.readAsArrayBuffer(file);
};

// --- 新增考核项 ---
const addNewItem = async () => {
  addingItem.value = true
  const { error } = await supabase
    .from('scoring_items')
    .insert({
      ...newItem.value,
      // creator: '管理员 (待薪福通OAuth集成)' // 谁创建的
    })

  if (error) {
    console.error('新增考核项失败:', error.message)
    alert('新增失败：' + error.message)
  } else {
    alert('考核项添加成功！')
    newItem.value = { category: '', sub_category: '', score_impact: null, description: '' }
    fetchScoringItems() // 重新加载列表
  }
  addingItem.value = false
}

// --- 编辑考核项 ---
const startEdit = (item) => {
  editingItem.value = { ...item } // 复制一份进行编辑，不直接修改原始数据
}

const cancelEdit = () => {
  editingItem.value = null
}

const saveEditedItem = async () => {
  if (!editingItem.value) return
  savingEdit.value = true
  const { id, category, sub_category, score_impact, description } = editingItem.value
  const { error } = await supabase
    .from('scoring_items')
    .update({ category, sub_category, score_impact, description /*, modifier: '管理员 (待薪福通OAuth集成)' */ })
    .eq('id', id)

  if (error) {
    console.error('更新考核项失败:', error.message)
    alert('更新失败：' + error.message)
  } else {
    alert('考核项更新成功！')
    fetchScoringItems()
    editingItem.value = null
  }
  savingEdit.value = false
}

// --- 删除考核项 ---
const deleteItem = async (id) => {
  if (!confirm('确定要删除这项考核标准吗？这将无法撤销。')) return

  deletingItem.value = id
  const { error } = await supabase
    .from('scoring_items')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('删除失败:', error.message)
    alert('删除失败')
  } else {
    fetchScoringItems()
  }
  deletingItem.value = null
}

// --- 同步薪福通人员数据 (调用 Edge Function) ---
const syncStaffData = async () => {
  syncingStaff.value = true
  try {
    const { data, error } = await supabase.functions.invoke('sync-xft-staff')
    if (error) throw error
    alert('人员数据同步成功！')
    lastStaffSync.value = new Date().toISOString()
  } catch (error) {
    console.error('人员同步失败:', error.message)
    alert('同步失败，请检查 Edge Function 配置')
  } finally {
    syncingStaff.value = false
  }
}

onMounted(() => {
  fetchScoringItems()
})
</script>
