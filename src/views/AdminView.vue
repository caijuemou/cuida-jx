<template>
  <div class="max-w-6xl mx-auto p-6 space-y-6">
    <h1 class="text-2xl font-black">系统管理中心</h1>
    <router-link 
        to="/admin/items" 
        class="flex items-center gap-3 px-5 py-5 bg-indigo-600 rounded-2xl border border-blue-100 shadow-sm text-l font-black text-white hover:bg-indigo-700 hover:text-white transition-all active:scale-95"
      >
        <LayoutGridIcon :size="20" />
        点击查看及修改维护考核标准
      </router-link>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <h3 class="font-bold mb-4 flex items-center text-indigo-600">
          <UserIcon class="mr-2" :size="20"/> 1. 同步在职员工 
        </h3>
        <textarea v-model="staffJson" placeholder="粘贴员工列表数据..." class="w-full h-48 p-4 bg-gray-50 rounded-2xl border-none text-xs mb-4 focus:ring-2 focus:ring-indigo-500"></textarea>
        <button @click="syncStaff" class="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all">执行员工同步</button>
      </div>

      <div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <h3 class="font-bold mb-4 flex items-center text-emerald-600">
          <LayersIcon class="mr-2" :size="20"/> 2. 同步部门架构 
        </h3>
        <textarea v-model="deptJson" placeholder="粘贴部门架构数据..." class="w-full h-48 p-4 bg-gray-50 rounded-2xl border-none text-xs mb-4 focus:ring-2 focus:ring-emerald-500"></textarea>
        <button @click="syncDepts" class="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all">执行架构同步</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from '../composables/useSupabase'
import { UserIcon, LayersIcon, LayoutGridIcon } from 'lucide-vue-next'

const staffJson = ref('')
const deptJson = ref('')

// 同步员工：严格对齐 USRNBR 和核心字段
const syncStaff = async () => {
  try {
    const parsed = JSON.parse(staffJson.value)
    const records = parsed.OPUSRLSTY || 
                    (parsed.body && parsed.body.userList) || 
                    (parsed.body && parsed.body.records)
    
    if (!records || !Array.isArray(records)) {
      throw new Error('未能识别的人员列表格式，请确保数据包含 OPUSRLSTY 或 userList 数组')
    }

    const allStaff = records.map(r => ({
      // 必须确保这个值是 V 开头的！
      xft_user_id: r.USRNBR, 
      name: r.USRNAM,
      dept_name: r.ORGNAM,
      dept_id: r.ORGSEQ,
      job_title: r.PSTNAM,
      staff_seq: r.STFSEQ,
      staff_number: r.STFNBR, // CD000x 存这里
      gender: r.SEXFLG,
      project_code: r.PRJCOD,
      status: r.USRSTS,
      is_active: r.USRSTS !== 'D'
    })).filter(s => s.xft_user_id && s.xft_user_id.startsWith('V')) // 增加一个保险过滤
 
    // 执行 Upsert
    const { error } = await supabase
      .from('staff_cache')
      .upsert(allStaff, { onConflict: 'xft_user_id' })

    if (error) throw error
    alert(`成功同步 ${allStaff.length} 名在职人`)
    staffJson.value = '' // 清空输入框
  } catch (err) { 
    alert('员工同步失败: ' + err.message) 
    console.error(err)
  }
}

// 同步部门保持不变，但建议增加 code 作为主键
const syncDepts = async () => {
  try {
    const parsed = JSON.parse(deptJson.value)
    const records = parsed.body?.records || []
    
    if (records.length === 0) throw new Error('JSON 格式不匹配或 records 为空')

    const depts = records.map(r => {
      // 1. 统一 ID：第一段叫 id，第二段叫 orgId
      const finalCode = r.id || r.orgId;
      
      // 2. 计算层级 (仅针对第一段数据)
      const pathParts = r.namePath ? r.namePath.split('/') : []
      
      return {
        code: finalCode,
        // 如果是第一段数据，会有这些详细字段
        name: r.name || null, 
        name_path: r.namePath || null,
        parent_code: r.parentId || null,
        level: pathParts.length > 0 ? pathParts.length : null,
        // 如果是第二段数据，会有映射字段
        external_id: r.outId || null,
        source: r.source || null
      }
    })

    // 过滤掉没有 code 的无效记录
    const validDepts = depts.filter(d => d.code)

    const { error } = await supabase
      .from('dept_cache')
      .upsert(validDepts, { onConflict: 'code' })

    if (error) throw error
    alert(`成功处理 ${validDepts.length} 条架构数据。请确保两段 JSON 都已分别粘贴同步过。`)
    deptJson.value = ''
  } catch (err) {
    alert('同步失败: ' + err.message)
  }
}
</script>
