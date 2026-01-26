<template>
  <div class="max-w-6xl mx-auto p-6 pb-24 space-y-8">
    <div class="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
      <div>
        <h1 class="text-3xl font-black text-gray-900 tracking-tight">指标与员工管理</h1>
        <p class="text-gray-400 mt-1 font-medium">配置考核维度，并手动全量同步员工档案</p>
      </div>

      <div class="flex gap-3">
        <button
          @click="showSyncModal = true"
          class="px-6 py-3.5 bg-white border-2 border-indigo-50 text-indigo-600 rounded-2xl text-sm font-black flex items-center shadow-sm hover:border-indigo-200 hover:bg-indigo-50 transition-all active:scale-95"
        >
          <RefreshCwIcon :size="18" class="mr-2" /> 同步薪福通员工
        </button>

        <button
          @click="openAddModal"
          class="px-6 py-3.5 bg-indigo-600 text-white rounded-2xl text-sm font-black flex items-center shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
        >
          <PlusIcon :size="18" class="mr-2" /> 新增考核指标
        </button>
      </div>
    </div>

    <div class="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <table class="w-full text-left border-collapse">
        <thead class="bg-gray-50/50">
          <tr>
            <th class="p-5 text-xs font-black text-gray-400 uppercase tracking-widest">分类</th>
            <th class="p-5 text-xs font-black text-gray-400 uppercase tracking-widest">子项</th>
            <th class="p-5 text-xs font-black text-gray-400 uppercase tracking-widest text-center">扣分上限</th>
            <th class="p-5 text-xs font-black text-gray-400 uppercase tracking-widest text-right">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr v-for="item in items" :key="item.id" class="hover:bg-indigo-50/30 transition-colors">
            <td class="p-5">
              <span class="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold">{{ item.category }}</span>
            </td>
            <td class="p-5 font-bold text-gray-700">{{ item.sub_category }}</td>
            <td class="p-5 text-center font-black text-rose-500">{{ item.score_impact }}</td>
            <td class="p-5 text-right space-x-2">
              <button @click="editItem(item)" class="p-2 text-gray-400 hover:text-indigo-600 transition-colors"><Edit2Icon :size="18" /></button>
              <button @click="deleteItem(item.id)" class="p-2 text-gray-400 hover:text-rose-600 transition-colors"><Trash2Icon :size="18" /></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showSyncModal" class="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-[2rem] w-full max-w-2xl p-8 shadow-2xl relative">
        <div class="mb-6 text-center">
          <div class="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
             <RefreshCwIcon :size="32" />
          </div>
          <h3 class="text-2xl font-black text-gray-900">全量员工同步</h3>
          <p class="text-gray-400 mt-2 text-sm leading-relaxed px-10">
            请在薪福通接口测试器中调用 <span class="text-indigo-600 font-bold">获取员工列表</span>，并将返回的完整 JSON 粘贴在下方。
          </p>
        </div>

        <textarea
          v-model="xftJsonResponse"
          placeholder='粘贴包含 "records": [...] 的 JSON 报文...'
          class="w-full h-72 p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none font-mono text-xs transition-all mb-6"
        ></textarea>

        <div class="flex gap-3">
          <button @click="showSyncModal = false" class="flex-1 py-4 text-sm font-black text-gray-400 hover:bg-gray-100 rounded-2xl transition-all">取消</button>
          <button
            @click="handleSyncStaff"
            :disabled="!xftJsonResponse"
            class="flex-1 py-4 text-sm font-black bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 disabled:bg-gray-200 transition-all"
          >
            解析并入库 (140+ 员工)
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../composables/useSupabase'
import { PlusIcon, RefreshCwIcon, Edit2Icon, Trash2Icon } from 'lucide-vue-next'

const items = ref([])
const showSyncModal = ref(false)
const xftJsonResponse = ref('')

// 1. 获取指标数据
const loadData = async () => {
  const { data } = await supabase.from('scoring_items').select('*').order('created_at', { ascending: false })
  items.value = data || []
}

// 2. 核心逻辑：解析并更新数据库
const handleSyncStaff = async () => {
  try {
    const rawData = JSON.parse(xftJsonResponse.value)

    // 适配薪福通报文结构
    const records = rawData.body?.records || rawData.records
    
    if (!records || !Array.isArray(records)) {
      alert('解析失败：未找到 records 数组，请确保粘贴的是完整的响应报文。')
      return
    }

    // 字段精确映射
    const staffData = records.map(record => {
      const basic = record.staffBasicInfo || {}
      return {
        xft_user_id: basic.stfNumber,    // 映射为工号
        name: basic.stfName,           // 映射为姓名
        dept_name: basic.orgName,      // 重点：直接存店名（如湾悦城店）
        job_title: basic.posName,      // 重点：直接存岗位名
        mobile: basic.mobile,          // 手机号
        staff_seq: basic.stfSeq,       // 内部序列号
        last_sync_at: new Date().toISOString()
      }
    }).filter(s => s.xft_user_id)

    if (staffData.length === 0) {
      alert('未识别到有效员工信息')
      return
    }

    // 批量 Upsert
    const { error } = await supabase
      .from('staff_cache')
      .upsert(staffData, { onConflict: 'xft_user_id' })

    if (error) throw error

    alert(`🎉 同步成功！已刷新 ${staffData.length} 名员工数据。`)
    showSyncModal.value = false
    xftJsonResponse.value = ''

  } catch (err) {
    console.error('Sync Error:', err)
    alert('同步失败：' + (err.message.includes('Unexpected token') ? 'JSON 格式不正确' : err.message))
  }
}

// 占位函数
const openAddModal = () => alert('请在数据库中添加，或在此实现 UI 弹窗')
const editItem = (item) => alert('编辑: ' + item.sub_category)
const deleteItem = (id) => alert('删除 ID: ' + id)

onMounted(loadData)
</script>
