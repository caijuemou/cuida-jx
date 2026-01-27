<template>
  <div class="max-w-6xl mx-auto p-6 space-y-6">
    <h1 class="text-2xl font-black">系统同步中心</h1>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <h3 class="font-bold mb-4 flex items-center text-indigo-600">
          <UserIcon class="mr-2" :size="20"/> 1. 同步在职员工 (过滤D)
        </h3>
        <textarea v-model="staffJson" placeholder="粘贴员工列表 JSON..." class="w-full h-48 p-4 bg-gray-50 rounded-2xl border-none text-xs mb-4 focus:ring-2 focus:ring-indigo-500"></textarea>
        <button @click="syncStaff" class="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all">执行员工同步</button>
      </div>

      <div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <h3 class="font-bold mb-4 flex items-center text-emerald-600">
          <LayersIcon class="mr-2" :size="20"/> 2. 同步部门架构 (修复区域)
        </h3>
        <textarea v-model="deptJson" placeholder="粘贴部门架构 JSON..." class="w-full h-48 p-4 bg-gray-50 rounded-2xl border-none text-xs mb-4 focus:ring-2 focus:ring-emerald-500"></textarea>
        <button @click="syncDepts" class="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all">执行架构同步</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from '../composables/useSupabase'
import { UserIcon, LayersIcon } from 'lucide-vue-next'

const staffJson = ref('')
const deptJson = ref('')

// 同步员工：剔除 D，保留 A/J 等
const syncStaff = async () => {
  try {
    const parsed = JSON.parse(staffJson.value)
    const records = parsed.OPUSRLSTY || (parsed.body && parsed.body.records)
    const allStaff = records.map(r => ({
      xft_user_id: r.STFNBR || r.USRNBR || r.STFSEQ,
      name: r.USRNAM,
      dept_name: r.ORGNAM,
      job_title: r.PSTNAM,
      is_active: r.USRSTS !== 'D' // 剔除 D 状态
    })).filter(s => s.xft_user_id && s.name)

    const { error } = await supabase.from('staff_cache').upsert(allStaff, { onConflict: 'xft_user_id' })
    if (error) throw error
    alert(`成功同步 ${allStaff.length} 名人员状态`)
  } catch (err) { alert('员工同步失败: ' + err.message) }
}

// 同步部门：解析完整的 namePath
const syncDepts = async () => {
  try {
    const parsed = JSON.parse(deptJson.value)
    const records = parsed.body.records
    const depts = records.map(r => ({
      code: r.code,
      name: r.name,
      name_path: r.namePath,
      parent_name: r.parentName
    }))

    const { error } = await supabase.from('dept_cache').upsert(depts)
    if (error) throw error
    alert(`成功同步 ${depts.length} 个部门节点`)
  } catch (err) { alert('架构同步失败: ' + err.message) }
}
</script>