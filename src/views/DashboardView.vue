<template>
  <div class="min-h-screen bg-[#020617] text-white p-6 font-sans overflow-hidden">
    <div class="flex justify-between items-center mb-8 bg-slate-900/50 p-6 rounded-3xl border border-slate-800 backdrop-blur-md">
      <div>
        <h1 class="text-3xl font-black bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent tracking-tighter">
          绩效考核实时监控大屏
        </h1>
        <p class="text-slate-400 text-xs mt-1 uppercase tracking-widest font-bold">Performance Real-time Analytics</p>
      </div>
      <div class="text-right">
        <div class="text-2xl font-mono font-bold text-blue-400 leading-none">{{ currentTime }}</div>
        <div class="text-[10px] text-slate-500 font-bold uppercase mt-1">System Live Feed</div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div v-for="stat in stats" :key="stat.label" class="bg-slate-900/40 p-6 rounded-3xl border border-slate-800 hover:border-blue-500/50 transition-all relative overflow-hidden group">
        <div class="absolute -right-4 -bottom-4 text-blue-500/10 group-hover:text-blue-500/20 transition-colors">
          <ActivityIcon :size="80" />
        </div>
        <p class="text-slate-400 text-xs font-bold mb-2 uppercase tracking-wider relative z-10">{{ stat.label }}</p>
        <div class="flex items-end gap-2 relative z-10">
          <span class="text-4xl font-black tracking-tighter text-white">{{ stat.value }}</span>
          <span class="text-blue-500 text-xs font-bold mb-1">{{ stat.unit }}</span>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2 bg-slate-900/40 rounded-[2rem] p-8 border border-slate-800 flex flex-col">
        <h3 class="text-lg font-black mb-6 flex items-center">
          <div class="w-2 h-6 bg-blue-500 rounded-full mr-3 shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
          各部门扣分分布统计
        </h3>
        <div class="flex-1 w-full min-h-[400px]" ref="chartRef"></div>
      </div>

      <div class="bg-slate-900/40 rounded-[2rem] p-8 border border-slate-800 flex flex-col h-[500px]">
        <h3 class="text-lg font-black mb-6 flex items-center">
          <div class="w-2 h-6 bg-rose-500 rounded-full mr-3 shadow-[0_0_15px_rgba(244,63,94,0.5)]"></div>
          实时扣分动态
        </h3>
        <div class="flex-1 overflow-hidden relative group">
          <div class="space-y-4" :class="{ 'animate-scroll': recentLogs.length > 5 }">
            <div v-for="(log, index) in recentLogs" :key="index"
                 class="bg-slate-800/30 p-4 rounded-2xl border-l-4 border-rose-500/50 flex justify-between items-center backdrop-blur-sm">
              <div class="flex flex-col gap-1">
                <div class="font-bold text-sm text-slate-100">{{ log.staff_name }}</div>
                <div class="text-[10px] text-slate-400 font-medium">
                  <span class="text-blue-400">{{ log.dept }}</span> · {{ log.reason }}
                </div>
              </div>
              <div class="text-rose-500 font-black text-xl tabular-nums">-{{ log.score }}</div>
            </div>
            <div v-if="recentLogs.length === 0" class="text-center text-slate-500 py-20 text-sm italic">
              暂无今日扣分记录
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { supabase } from '../composables/useSupabase'
import * as echarts from 'echarts'
import { ActivityIcon } from 'lucide-vue-next'

const currentTime = ref('')
const chartRef = ref(null)
let myChart = null

const stats = ref([
  { label: '累计扣分总计', value: '0', unit: '分' },
  { label: '涉及异常人数', value: '0', unit: '人' },
  { label: '平均扣分幅度', value: '0', unit: '分' },
  { label: '数据同步状态', value: '正常', unit: 'Ready' }
])

const recentLogs = ref([])

// 1. 获取真实数据
const fetchDashboardData = async () => {
  try {
    // A. 获取总计和统计 (这里假设你已经有 performance_logs 表)
    const { data: allLogs, error: logErr } = await supabase
      .from('performance_logs')
      .select('final_score, staff_id')

    if (allLogs) {
      const totalScore = allLogs.reduce((s, c) => s + Number(c.final_score), 0)
      const uniqueStaff = new Set(allLogs.map(l => l.staff_id)).size
      stats.value[0].value = totalScore.toLocaleString()
      stats.value[1].value = uniqueStaff.toLocaleString()
      stats.value[2].value = allLogs.length ? (totalScore / allLogs.length).toFixed(1) : '0'
    }

    // B. 获取最近记录 (关联 staff_cache)
    const { data: logs, error: recentErr } = await supabase
      .from('performance_logs')
      .select(`
        final_score,
        staff_cache ( name, dept_name )
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    if (logs) {
      recentLogs.value = logs.map(l => ({
        staff_name: l.staff_cache?.name || '未知',
        dept: l.staff_cache?.dept_name || '外部',
        reason: '考核减分',
        score: l.final_score
      }))
    }

    // C. 更新图表数据 (按部门统计)
    updateChart()

  } catch (err) {
    console.error('Dashboard Error:', err)
  }
}

// 2. 初始化图表
const updateChart = () => {
  if (!myChart) myChart = echarts.init(chartRef.value)

  const option = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', backgroundColor: '#0f172a', borderColor: '#1e293b', textStyle: { color: '#fff' } },
    grid: { left: '2%', right: '2%', bottom: '5%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ['销售部', '技术部', '财务部', '市场部', '人事部'], // 后续可从数据库聚合
      axisLine: { lineStyle: { color: '#334155' } },
      axisLabel: { color: '#94a3b8', fontSize: 11, fontWeight: 'bold' }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } },
      axisLabel: { color: '#64748b' }
    },
    series: [{
      data: [120, 210, 150, 80, 120],
      type: 'bar',
      barWidth: '35%',
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#60a5fa' },
          { offset: 1, color: '#3b82f6' }
        ]),
        borderRadius: [8, 8, 0, 0]
      },
      emphasis: { itemStyle: { color: '#93c5fd' } }
    }]
  }
  myChart.setOption(option)
}

const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('zh-CN', { hour12: false })
}

let timeTimer, refreshTimer

onMounted(() => {
  updateTime()
  timeTimer = setInterval(updateTime, 1000)

  fetchDashboardData()
  // 每 30 秒自动刷新一次数据
  refreshTimer = setInterval(fetchDashboardData, 30000)

  window.addEventListener('resize', () => myChart?.resize())
})

onUnmounted(() => {
  clearInterval(timeTimer)
  clearInterval(refreshTimer)
  window.removeEventListener('resize', () => myChart?.resize())
})
</script>

<style scoped>
@keyframes scroll {
  0% { transform: translateY(0); }
  100% { transform: translateY(-50%); }
}

.animate-scroll {
  animation: scroll 25s linear infinite;
}

.animate-scroll:hover {
  animation-play-state: paused;
}

/* 隐藏滚动条 */
::-webkit-scrollbar {
  width: 0px;
}
</style>
