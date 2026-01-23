<template>
  <div class="max-w-2xl mx-auto pb-24">
    <div class="mb-8 p-6 bg-gradient-to-br from-blue-700 to-indigo-800 rounded-3xl text-white shadow-xl relative overflow-hidden">
      <div class="relative z-10">
        <h2 class="text-2xl font-extrabold tracking-tight">绩效打分工作台</h2>
        <p class="text-blue-100 text-sm mt-1 opacity-90">请选择员工并录入表现项</p>
      </div>
      <div class="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
    </div>

    <div class="mb-8 group">
      <div class="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 transition-all group-focus-within:shadow-indigo-100 group-focus-within:border-indigo-200">
        <div class="relative">
          <input
            v-model="searchStaffQuery"
            @input="debouncedSearchStaff"
            type="text"
            placeholder="搜索工号或姓名..."
            class="w-full pl-12 pr-4 py-4 bg-transparent text-gray-700 placeholder-gray-400 outline-none font-medium"
          />
          <div class="absolute left-4 top-4 text-indigo-500">
            <SearchIcon :size="20" />
          </div>
        </div>
      </div>

      <div v-if="staffSearchResults.length && !selectedStaff" class="mt-2 bg-white rounded-2xl shadow-xl border border-gray-50 overflow-hidden divide-y divide-gray-50">
        <div
          v-for="staff in staffSearchResults"
          :key="staff.xft_user_id"
          @click="selectStaff(staff)"
          class="p-4 cursor-pointer hover:bg-indigo-50 transition-colors flex items-center"
        >
          <div class="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold mr-3">
            {{ staff.name.charAt(0) }}
          </div>
          <div>
            <div class="font-bold text-gray-800">{{ staff.name }}</div>
            <div class="text-xs text-gray-400">{{ staff.dept_name }} · {{ staff.job_title }}</div>
          </div>
        </div>
      </div>
    </div>

    <Transition name="fade">
      <div v-if="selectedStaff" class="mb-8 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center justify-between">
        <div class="flex items-center">
          <div class="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg mr-4">
            <UserIcon :size="24" />
          </div>
          <div>
            <div class="text-xs text-indigo-400 font-bold uppercase tracking-wider">当前考核对象</div>
            <div class="text-lg font-black text-indigo-900">{{ selectedStaff.name }}</div>
          </div>
        </div>
        <button @click="clearSelectedStaff" class="p-2 hover:bg-white rounded-xl text-indigo-400 transition-colors">
          <XIcon :size="20" />
        </button>
      </div>
    </Transition>

    <div class="space-y-4">
      <div
        v-for="item in filteredItems"
        :key="item.id"
        class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex justify-between items-center group hover:shadow-md transition-all active:scale-[0.98]"
      >
        <div class="flex-1 border-l-4 border-transparent group-hover:border-indigo-500 pl-4 transition-all">
          <div class="text-sm font-bold text-gray-500 uppercase tracking-tighter mb-1">{{ item.category }}</div>
          <div class="text-gray-900 font-extrabold text-lg">{{ item.sub_category }}</div>
          <div class="text-sm text-gray-400 mt-1 line-clamp-1 italic">{{ item.description || '无备注说明' }}</div>
        </div>

        <div class="flex flex-col items-end ml-4">
          <div :class="item.score_impact < 0 ? 'text-rose-500 bg-rose-50' : 'text-emerald-500 bg-emerald-50'"
               class="px-3 py-1 rounded-full font-black text-sm mb-3">
            {{ item.score_impact > 0 ? '+' : '' }}{{ item.score_impact }}
          </div>
          <button
            @click="submitScore(item)"
            :disabled="!selectedStaff"
            class="bg-gray-900 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-gray-200 disabled:bg-gray-200 disabled:shadow-none hover:bg-indigo-600 transition-all"
          >
            确认提交
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// 注意：需要安装并引入图标库
import { SearchIcon, UserIcon, XIcon } from 'lucide-vue-next'
// ... 保留之前的逻辑代码
</script>
