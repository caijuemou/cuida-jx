<template>
  <div class="max-w-4xl mx-auto pb-24">
    <div class="mb-8 p-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl text-white shadow-xl relative overflow-hidden">
      <div class="relative z-10">
        <h2 class="text-2xl font-extrabold tracking-tight">系统管理后台</h2>
        <p class="text-slate-300 text-sm mt-1">维护考核标准与人员同步</p>
      </div>
      <SettingsIcon class="absolute -right-4 -bottom-4 w-32 h-32 text-white/5 rotate-12" />
    </div>

    <div class="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-8">
      <div class="flex items-center mb-6">
        <div class="p-3 bg-emerald-50 text-emerald-600 rounded-2xl mr-4">
          <FileUpIcon :size="24" />
        </div>
        <div>
          <h3 class="font-black text-gray-800 text-lg">批量导入考核项</h3>
          <p class="text-sm text-gray-400">支持 .xlsx / .xls 格式</p>
        </div>
      </div>

      <div class="flex flex-col md:flex-row gap-4 items-center">
        <label class="w-full md:w-auto flex-1">
          <div class="border-2 border-dashed border-gray-200 rounded-2xl p-8 hover:border-emerald-400 hover:bg-emerald-50/30 transition-all cursor-pointer text-center group">
            <input type="file" class="hidden" @change="handleFileUpload" accept=".xlsx, .xls" />
            <div class="text-gray-400 group-hover:text-emerald-600 transition-colors">
              <span class="font-bold">点击上传文件</span> 或将文件拖到这里
            </div>
          </div>
        </label>

        <div class="w-full md:w-64 space-y-2">
          <button @click="downloadTemplate" class="w-full py-3 text-sm font-bold text-gray-600 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all flex items-center justify-center">
            <DownloadIcon :size="16" class="mr-2" /> 下载模板
          </button>
        </div>
      </div>

      <div v-if="importPreview.length > 0" class="mt-8 border-t pt-6">
        <div class="flex justify-between items-center mb-4">
          <span class="text-sm font-bold text-gray-500">预览已解析的数据 ({{ importPreview.length }} 条)</span>
          <div class="space-x-2">
            <button @click="importPreview = []" class="text-sm text-gray-400 hover:text-gray-600">取消</button>
            <button @click="confirmImport" :disabled="isImporting" class="px-6 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-100 disabled:opacity-50">
              {{ isImporting ? '写入中...' : '确认导入数据库' }}
            </button>
          </div>
        </div>
        <div class="max-h-60 overflow-y-auto rounded-xl border border-gray-50 text-xs">
          <table class="w-full text-left border-collapse">
            <thead class="bg-gray-50 sticky top-0">
              <tr>
                <th class="p-3 text-gray-400">分类</th>
                <th class="p-3 text-gray-400">项目</th>
                <th class="p-3 text-gray-400 text-right">分值</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in importPreview" :key="idx" class="border-t border-gray-50">
                <td class="p-3 font-bold">{{ row.category }}</td>
                <td class="p-3">{{ row.sub_category }}</td>
                <td class="p-3 text-right" :class="row.score_impact < 0 ? 'text-rose-500' : 'text-emerald-500'">{{ row.score_impact }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <div class="p-3 bg-purple-50 text-purple-600 rounded-2xl mr-4">
            <UsersIcon :size="24" />
          </div>
          <div>
            <h3 class="font-black text-gray-800 text-lg">员工花名册同步</h3>
            <p class="text-sm text-gray-400">同步薪福通最新的员工组织架构</p>
          </div>
        </div>
        <button @click="syncStaff" :disabled="isSyncing" class="px-6 py-3 bg-purple-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-purple-100 disabled:bg-gray-200 transition-all flex items-center">
          <RefreshCwIcon :size="18" class="mr-2" :class="{'animate-spin': isSyncing}" />
          {{ isSyncing ? '正在同步...' : '立即同步' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from '../composables/useSupabase'
import * as XLSX from 'xlsx'
import {
  SettingsIcon, FileUpIcon, DownloadIcon,
  UsersIcon, RefreshCwIcon
} from 'lucide-vue-next'

const importPreview = ref([])
const isImporting = ref(false)
const isSyncing = ref(false)

// --- Excel 解析逻辑 ---
const handleFileUpload = (e) => {
  const file = e.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (event) => {
    const data = new Uint8Array(event.target.result)
    const workbook = XLSX.read(data, { type: 'array' })
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]]

    // 将 Excel 转为 JSON
    const jsonData = XLSX.utils.sheet_to_json(firstSheet)

    // 数据映射：将 Excel 的列名映射到数据库字段
    importPreview.value = jsonData.map(row => ({
      category: row['考核大类'] || row['分类'] || '未分类',
      sub_category: row['考核项'] || row['项目'] || '未命名',
      score_impact: parseFloat(row['分值'] || row['得分'] || 0),
      description: row['描述'] || row['备注'] || ''
    }))
  }
  reader.readAsArrayBuffer(file)
}

// --- 写入数据库 ---
const confirmImport = async () => {
  if (importPreview.value.length === 0) return
  isImporting.value = true

  try {
    // 采用 upsert 模式：如果 category 和 sub_category 重复则更新，否则插入
    const { error } = await supabase
      .from('scoring_items')
      .upsert(importPreview.value, { onConflict: 'category,sub_category' })

    if (error) throw error
    alert('导入成功！已更新考核项数据库。')
    importPreview.value = []
  } catch (err) {
    console.error(err)
    alert('写入失败：' + err.message)
  } finally {
    isImporting.value = false
  }
}

// --- 同步薪福通人员 (模拟流程) ---
const syncStaff = async () => {
  isSyncing.value = true
  // 这里需要调用我们之前提到的 Supabase Edge Function
  // 逻辑：Edge Function 请求薪福通 API -> 获取人员列表 -> 写入 staff_cache 表
  setTimeout(() => {
    alert('演示模式：同步指令已发出，请稍后刷新打分页。')
    isSyncing.value = false
  }, 2000)
}

// --- 下载模板 (简单的 CSV 伪代码) ---
const downloadTemplate = () => {
  const ws = XLSX.utils.json_to_sheet([
    { '考核大类': '考勤类', '考核项': '迟到', '分值': -5, '描述': '上班迟到30分钟以内' },
    { '考核大类': '奖励类', '考核项': '拾金不昧', '分值': 10, '描述': '归还员工遗失财物' }
  ])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '考核模板')
  XLSX.writeFile(wb, '考核项导入模板.xlsx')
}
</script>
