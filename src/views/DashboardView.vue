<template>
  <div class="min-h-screen bg-[#020617] text-white p-4 md:p-6 font-sans overflow-x-hidden">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-slate-900/50 p-6 rounded-3xl border border-slate-800 backdrop-blur-md gap-4">
      <div>
        <h1 class="text-2xl md:text-3xl font-black bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent tracking-tighter">
          绩效考核实时监控大屏
        </h1>
        <p class="text-slate-400 text-[10px] md:text-xs mt-1 uppercase tracking-widest font-bold">Store Performance Analytics</p>
      </div>
      <div class="text-left md:text-right border-l-2 md:border-l-0 md:border-r-2 border-blue-500/50 pl-4 md:pr-4">
        <div class="text-2xl font-mono font-bold text-blue-400 leading-none">{{ currentTime }}</div>
        <div class="text-[10px] text-slate-500 font-bold uppercase mt-1">Live Feed Active</div>
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
      <div v-for="stat in stats" :key="stat.label" class="bg-slate-900/40 p-5 md:p-6 rounded-3xl border border-slate-800 hover:border-blue-500/50 transition-all relative overflow-hidden group">
        <div class="absolute -right-4 -bottom-4 text-blue-500/10 group-hover:text-blue-500/20 transition-colors">
          <ActivityIcon :size="60" />
        </div>
        <p class="text-slate-500 text-[10px] md:text-xs font-bold mb-2 uppercase tracking-wider relative z-10">{{ stat.label }}</p>
        <div class="flex items-end gap-1 md:gap-2 relative z-10">
          <span class="text-2xl md:text-4xl font-black tracking-tighter text-white">{{ stat.value }}</span>
          <span class="text-blue-500 text-[10px] font-bold mb-1">{{ stat.unit }}</span>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2 bg-slate-900/40 rounded-[2rem] p-6 md:p-8 border border-slate-800 flex flex-col">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-lg font-black flex items-center">
            <div class="w-2 h-6 bg-blue-500 rounded-full mr-3 shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
            各门店历史扣分汇总
          </h3>
          <span class="text-[10px] text-slate-500 font-bold px-3 py-1 bg-slate-800 rounded-full">TOP 15 STORES</span>
        </div>
        <div class="flex-1 w-full min-h-[350px] md:min-h-[400px]" ref="chartRef"></div>
      </div>

      <div class="bg-slate-900/40 rounded-[2rem] p-6 md:p-8 border border-slate-800 flex flex-col h-[450px] md:h-[530px]">
        <h3 class="text-lg font-black mb-6 flex items-center">
          <div class="w-2 h-6 bg-rose-500 rounded-full mr-3 shadow-[0_0_15px_rgba(244,63,94,0.5)]"></div>
          最近扣分动态
        </h3>
        <div class="flex-1 overflow-hidden relative group">
          <div class="space-y-3" :class="{ 'animate-scroll': recentLogs.length > 6 }">
            <div v-for="(log, index) in recentLogs" :key="index"
                 class="bg-slate-800/20 p-4 rounded-2xl border-l-4 border-rose-500/30 flex justify-between items-center backdrop-blur-sm hover:bg-slate-800/40 transition-colors">
              <div class="flex flex-col gap-1 pr-2">
                <div class="font-bold text-sm text-slate-100 flex items-center gap-2">
                  {{ log.staff_name }}
                  <span class="text-[9px] font-normal px-1.5 py-0.5 bg-slate-700 rounded text-slate-400">{{ log.date }}</span>
                </div>
                <div class="text-[10px] text-slate-400 font-medium truncate max-w-[150px] md:max-w-full">
                  <span class="text-blue-400/80">{{ log.store }}</span> · {{ log.reason }}
                </div>
              </div>
              <div class="text-rose-500 font-black text-xl tabular-nums">-{{ log.score }}</div>
            </div>
            <template v-if="recentLogs.length > 6">
                <div v-for="(log, index) in recentLogs" :key="'dup-'+index"
                     class="bg-slate-800/20 p-4 rounded-2xl border-l-4 border-rose-500/30 flex justify-between items-center backdrop-blur-sm">
                  <div class="flex flex-col gap-1">
                    <div class="font-bold text-sm text-slate-100">{{ log.staff_name }}</div>
                    <div class="text-[10px] text-slate-400 font-medium italic">{{ log.store }}</div>
                  </div>
                  <div class="text-rose-500 font-black text-xl">-{{ log.score }}</div>
                </div>
            </template>
            <div v-if="recentLogs.length === 0" class="text-center text-slate-500 py-20 text-sm italic font-bold">
              NO RECORDS TODAY
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
  { label: '全域扣分总计', value: '0', unit: '分' },
  { label: '异常覆盖人数', value: '0', unit: '人' },
  { label: '单次扣分均值', value: '0', unit: '分' },
  { label: '系统监控状态', value: '运行', unit: 'OK' }
])

const recentLogs = ref([])

// 1. 获取并处理数据
const fetchDashboardData = async () => {
  try {
    // A. 基础统计
    const { data: allLogs } = await supabase
      .from('performance_logs')
      .select('final_score, staff_id, store_name, score_date')

    if (allLogs) {
      const totalScore = allLogs.reduce((s, c) => s + Number(c.final_score), 0)
      const uniqueStaff = new Set(allLogs.map(l => l.staff_id)).size
      stats.value[0].value = totalScore.toLocaleString()
      stats.value[1].value = uniqueStaff.toLocaleString()
      stats.value[2].value = allLogs.length ? (totalScore / allLogs.length).toFixed(1) : '0'

      // B. 聚合门店数据（柱状图）
      const storeMap = {}
      allLogs.forEach(log => {
        const store = log.store_name || '未知门店'
        storeMap[store] = (storeMap[store] || 0) + Number(log.final_score)
      })

      // 转换为 Echarts 格式并排序
      const chartData = Object.entries(storeMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 15) // 只显示前 15 名

      updateChart(chartData)

      // C. 处理最近动态
      // 这里的 .select 关联了 scoring_items 表来获取具体原因
      const { data: detailLogs } = await supabase
        .from('performance_logs')
        .select(`
          final_score,
          score_date,
          store_name,
          staff_cache(name),
          scoring_items(sub_category)
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      if (detailLogs) {
        recentLogs.value = detailLogs.map(l => ({
          staff_name: l.staff_cache?.name || '匿名',
          store: l.store_name || '未知',
          reason: l.scoring_items?.sub_category || '违规扣分',
          score: l.final_score,
          date: l.score_date?.split('-').slice(1).join('/') // 只显示 MM/DD
        }))
      }
    }
  } catch (err) {
    console.error('Data Fetch Error:', err)
  }
}

// 2. 初始化/更新图表
const updateChart = (data) => {
  if (!myChart && chartRef.value) {
      myChart = echarts.init(chartRef.value)
  }

  const option = {
    backgroundColor: 'transparent',
    tooltip: { 
      trigger: 'axis', 
      backgroundColor: 'rgba(15, 23, 42, 0.9)', 
      borderColor: '#334155', 
      borderWidth: 1,
      textStyle: { color: '#fff', fontSize: 12 },
      formatter: '{b}: <b style="color:#f43f5e">-{c}分</b>'
    },
    grid: { left: '1%', right: '3%', bottom: '5%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: data.map(i => i.name),
      axisLine: { lineStyle: { color: '#1e293b' } },
      axisLabel: { 
        color: '#94a3b8', 
        fontSize: 10, 
        rotate: data.length > 6 ? 35 : 0, // 门店多时自动倾斜
        fontWeight: 'bold' 
      }
    },
    yAxis: {
      type: 'value',
      name: '(分)',
      nameTextStyle: { color: '#475569', align: 'right' },
      splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } },
      axisLabel: { color: '#64748b', fontSize: 10 }
    },
    series: [{
      data: data.map(i => i.value),
      type: 'bar',
      barWidth: '45%',
      showBackground: true,
      backgroundStyle: { color: 'rgba(255, 255, 255, 0.02)', borderRadius: 10 },
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#60a5fa' }, // 亮蓝
          { offset: 1, color: '#1d4ed8' }  // 深蓝
        ]),
        borderRadius: [6, 6, 0, 0]
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
  refreshTimer = setInterval(fetchDashboardData, 60000) // 每分钟刷新一次

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
  animation: scroll 30s linear infinite;
}

.animate-scroll:hover {
  animation-play-state: paused;
}

/* 移动端滚动条美化 */
::-webkit-scrollbar {
  width: 4px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #1e293b;
  border-radius: 10px;
}
</style>