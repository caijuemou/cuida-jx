<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        <div class="text-lg font-black text-gray-900 tracking-tighter">
          PERFORMANCE <span class="text-indigo-600">SYS</span>
        </div>

        <div class="flex items-center gap-16"> <router-link
            to="/"
            class="nav-link"
            active-class="active-link"
          >
            打分
          </router-link>

          <router-link
            to="/admin"
            class="nav-link"
            active-class="active-link"
          >
            管理
          </router-link>

          <router-link
            to="/dashboard"
            class="nav-link"
            active-class="active-link"
          >
            大屏
          </router-link>
        </div>

        <div class="w-24 hidden md:block text-right">
          <span class="text-[10px] text-gray-300 font-bold uppercase tracking-widest">v1.2</span>
        </div>
      </div>
    </nav>

    <main class="max-w-7xl mx-auto py-8 px-6">
      <router-view></router-view>
    </main>
  </div>
</template>

<style scoped>
.nav-link {
  font-size: 1rem;
  font-weight: 700;
  color: #94a3b8; /* 默认灰色 */
  text-decoration: none;
  transition: color 0.2s ease;
  padding: 4px 0;
}

.nav-link:hover {
  color: #475569; /* 悬浮加深 */
}

/* 激活状态：仅改变颜色，不加背景或特殊效果 */
.active-link {
  color: #4f46e5 !important; /* 激活时使用品牌蓝 */
  position: relative;
}

/* 激活状态下的一个小装饰线条（可选，如果不想要可以删掉整个 ::after） */
.active-link::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: #4f46e5;
  border-radius: 2px;
}
</style>
