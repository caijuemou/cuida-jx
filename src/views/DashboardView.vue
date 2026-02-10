<template>
  <div class="min-h-screen bg-[#020617] text-white p-4 md:p-6 font-sans overflow-x-hidden">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-slate-900/50 p-6 rounded-3xl border border-slate-800 backdrop-blur-md gap-4 shadow-2xl">
      <div>
        <h1 class="text-2xl md:text-3xl font-black bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent tracking-tighter">
          CUIDA 绩效实时监控大屏
        </h1>
        <p class="text-slate-400 text-[10px] md:text-xs mt-1 uppercase tracking-widest font-bold flex items-center gap-2">
          <span class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          Store Performance Live Analytics
        </p>
      </div>
      <div class="text-left md:text-right border-l-2 md:border-l-0 md:border-r-2 border-indigo-500/50 pl-4 md:pr-4">
        <div class="text-2xl font-mono font-bold text-indigo-400 leading-none tabular-nums">{{ currentTime }}</div>
        <div class="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-tighter">Automatic Refresh Every 1m</div>
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
      <div v-for="stat in stats" :key="stat.label" class="bg-slate-900/40 p-5 md:p-6 rounded-3xl border border-slate-800 hover:border-indigo-500/50 transition-all relative overflow-hidden group shadow-lg">
        <div class="absolute -right-4 -bottom-4 text-indigo-500/10 group-hover:scale-110 transition-transform duration-500">
          <component :is="stat.icon" :size="80" />
        </div>
        <p class="text-slate-500 text-[10px] md:text-xs font-bold mb-2 uppercase tracking-wider relative z-10">{{ stat.label }}</p>
        <div class="flex items-end gap-1 md:gap-2 relative z-10">
          <span class="text-2xl md:text-4xl font-black tracking-tighter text-white tabular-nums">{{ stat.value }}</span>
          <span class="text-indigo-500 text-[10px] font-bold mb-1.5">{{ stat.unit }}</span>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2 bg-slate-900/40 rounded-[2.5rem] p-6 md:p-8 border border-slate-800 shadow-xl flex flex-col min-h-[450px]">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-lg font-black flex items-center">
            <div class="w-2 h-6 bg-indigo-500 rounded-full mr-3 shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
            门店扣分排行 (Top 15)
          </h3>
          <div class="flex gap-2">
            <span class="text-[9px] text-indigo-400 font-black px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full uppercase">Real-time Data</span>
          </div>
        </div>
        <div class="flex-1 w-full" ref="chartRef"></div>
      </div>

      <div class="bg-slate-900/40 rounded-[2.5rem] p-6 md:p-8 border border-slate-800 shadow-xl flex flex-col h-[530px]">
        <h3 class="text-lg font-black mb-6 flex items-center">
          <div class="w-2 h-6 bg-rose-500 rounded-full mr-3 shadow-[0_0_15px_rgba(244,63,94,0.5)]"></div>
          实时考核流水
        </h3>
        <div class="flex-1 overflow-hidden relative">
          <div v-if="recentLogs.length > 0" class="space-y-3" :class="{ 'animate-scroll': recentLogs.length > 5 }">
            <div v-for="(log, index) in [...recentLogs, ...recentLogs]" :key="index"
                 class="bg-slate-800/30 p-4 rounded-2xl border border-slate-700/50 flex justify-between items-center backdrop-blur-sm hover:bg-slate-700/40 transition-colors">
              <div class="flex flex-col gap-1 overflow-hidden">
                <div class="font-bold text-sm text-slate-100 flex items-center gap-2">
                  <span class="truncate">{{ log.staff_name }}</span>
                  <span class="shrink-0 text-[8px] font-black px-1.5 py-0.5 bg-slate-700 rounded text-slate-400 uppercase">{{ log.date }}</span>
                </div>
                <div class="text-[10px] text-slate-400 font-medium truncate">
                  <span class="text-indigo-400 font-bold">{{ log.store }}</span> · {{ log.reason }}
                </div>
              </div>
              <div class="text-rose-500 font-black text-xl tabular-nums ml-2">-{{ log.score }}</div>
            </div>
          </div>
          <div v-else class="h-full flex flex-col items-center justify-center text-slate-600 gap-3">
            <ActivityIcon :size="48" class="opacity-20" />
            <p class="text-sm font-bold italic tracking-widest uppercase">Waiting for records...</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, markRaw } from 'vue'
import { supabase } from '../composables/useSupabase'
import * as echarts from 'echarts'
import { ActivityIcon, UsersIcon, BarChart3Icon, ZapIcon } from 'lucide-vue-next'

const currentTime = ref('')
const chartRef = ref(null)
let myChart = null

// 统计项定义
const stats = ref([
  { label: '累计扣分分值', value: '0', unit: 'Pts', icon: markRaw(BarChart3Icon) },
  { label: '覆盖员工总数', value: '0', unit: 'Pax', icon: markRaw(UsersIcon) },
  { label: '今日新增记录', value: '0', unit: 'Rec', icon: markRaw(ZapIcon) },
  { label: '系统监控状态', value: 'Active', unit: 'OK', icon: markRaw(ActivityIcon) }
])

const recentLogs = ref([])

// 获取数据逻辑
const fetchDashboardData = async () => {
  try {
    // 1. 获取所有记录进行统计（匹配你的表字段）
    const { data: allLogs, error: fetchError } = await supabase
      .from('perf_records')
      .select(`
        score_value, 
        target_user_id, 
        target_name,
        target_dept_name, 
        record_date, 
        description,
        created_at
      `)
      .order('created_at', { ascending: false });

    if (fetchError) throw fetchError;

    if (allLogs) {
      // A. 基础统计计算
      // 核心：处理 text 类型的 score_value 并取绝对值
      const totalScore = allLogs.reduce((s, c) => s + Math.abs(parseFloat(c.score_value) || 0), 0);
      const uniqueStaff = new Set(allLogs.map(l => l.target_user_id)).size;
      
      // 计算今日新增 (record_date 为存储的考核日期)
      const todayStr = new Date().toISOString().split('T')[0];
      const todayLogsCount = allLogs.filter(l => l.record_date === todayStr).length;

      stats.value[0].value = totalScore.toLocaleString();
      stats.value[1].value = uniqueStaff.toLocaleString();
      stats.value[2].value = todayLogsCount.toLocaleString();

      // B. 聚合门店数据（柱状图）
      const storeMap = {};
      allLogs.forEach(log => {
        const store = log.target_dept_name || '未知门店';
        const val = Math.abs(parseFloat(log.score_value) || 0);
        storeMap[store] = (storeMap[store] || 0) + val;
      });

      const chartData = Object.entries(storeMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 15);

      updateChart(chartData);

      // C. 处理最近动态 (实时流水)
      recentLogs.value = allLogs.slice(0, 15).map(l => ({
        staff_name: l.target_name,
        store: l.target_dept_name || '未知',
        reason: l.description,
        score: Math.abs(parseFloat(l.score_value)),
        // 转换日期显示格式
        date: l.record_date ? l.record_date.substring(5).replace('-', '/') : '00/00' 
      }));
    }
  } catch (err) {
    console.error('Data Fetch Error:', err.message);
  }
};

// 图表初始化与更新
const updateChart = (data) => {
  if (!chartRef.value) return
  if (!myChart) {
    myChart = echarts.init(chartRef.value)
  }

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      borderColor: 'rgba(99, 102, 241, 0.5)',
      textStyle: { color: '#fff' },
      formatter: '{b}: <span style="color:#f43f5e;font-weight:bold">-{c}分</span>'
    },
    grid: { left: '2%', right: '2%', bottom: '5%', top: '12%', containLabel: true },
    xAxis: {
      type: 'category',
      data: data.map(i => i.name),
      axisLine: { lineStyle: { color: '#334155' } },
      axisLabel: { color: '#94a3b8', fontSize: 10, rotate: 30, fontWeight: 'bold' }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } },
      axisLabel: { color: '#64748b', fontSize: 10 }
    },
    series: [{
      data: data.map(i => i.value),
      type: 'bar',
      barWidth: '40%',
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#818cf8' }, // Indigo 400
          { offset: 1, color: '#4f46e5' }  // Indigo 600
        ]),
        borderRadius: [8, 8, 2, 2]
      },
      emphasis: { itemStyle: { color: '#a5b4fc' } }
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
  refreshTimer = setInterval(fetchDashboardData, 60000) // 1分钟同步一次

  window.addEventListener('resize', () => myChart?.resize())
})

onUnmounted(() => {
  clearInterval(timeTimer)
  clearInterval(refreshTimer)
  window.removeEventListener('resize', () => myChart?.resize())
})
</script>

<style scoped>
/* 无缝滚动关键帧 */
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

/* 玻璃拟态卡片微妙阴影 */
.shadow-xl {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.1);
}
</style>
