<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 p-6">
    <div class="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 text-center border border-gray-100 animate-in fade-in zoom-in duration-500">
      
      <div v-if="isProcessing" class="py-10">
        <div class="animate-spin text-indigo-600 mb-6 flex justify-center">
          <Loader2Icon :size="64" />
        </div>
        <h2 class="text-2xl font-black text-gray-900 tracking-tight">安全验证中</h2>
        <p class="text-gray-400 font-bold text-sm mt-3 animate-pulse">正在同步薪福通身份信息...</p>
      </div>

      <div v-else>
        <div class="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
          <ShieldCheckIcon class="text-indigo-600" :size="40" />
        </div>
        
        <h1 class="text-2xl font-black text-gray-900 mb-2 tracking-tight">CUIDA 绩效管理</h1>
        <p class="text-gray-400 font-bold text-sm mb-10 leading-relaxed px-4">
          请使用招商银行薪福通账号登录<br>确保您的考评数据安全归档
        </p>

        <button 
          @click="handleXFTLogin"
          class="group w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          <div class="w-6 h-6 bg-white rounded-full flex items-center justify-center group-hover:rotate-12 transition-transform">
            <div class="w-3 h-3 bg-red-600 rounded-sm"></div>
          </div>
          薪福通一键登录
        </button>

        <div class="mt-10 pt-8 border-t border-gray-50 flex flex-col items-center gap-2">
          <span class="text-[10px] text-gray-300 font-black uppercase tracking-[0.2em] leading-none">
            Digital Identity Service
          </span>
          <div class="flex gap-2">
            <div class="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
            <div class="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
            <div class="w-1.5 h-1.5 rounded-full bg-rose-400"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '../composables/useSupabase';
import { ShieldCheckIcon, Loader2Icon } from 'lucide-vue-next';

const router = useRouter();
const isProcessing = ref(false);

// 1. 发起登录：跳转到薪福通
const handleXFTLogin = () => {
  const XFT_DOMAIN = "https://xft.cmbchina.com";
  const APP_ID = "0692caa6-c700-403f-8667-96cd41adfca5";
  const REDIRECT_URI = encodeURIComponent(window.location.origin + "/login");
  const STATE = Date.now().toString();
  
  const authUrl = `${XFT_DOMAIN}/xft-gateway/xft-login-new/xwapi/oauth/authorize?app_id=${APP_ID}&redirect_uri=${REDIRECT_URI}&state=${STATE}`;
  window.location.href = authUrl;
};

// 2. 处理回调
onMounted(async () => {
  const params = new URLSearchParams(window.location.search);
  const data = params.get('data');

  if (data) {
    isProcessing.value = true;
    try {
      // --- 稳健的 Base64 转 UTF-8 解码 ---
      const rawData = window.atob(data.replace(/-/g, '+').replace(/_/g, '/'));
      const uint8Array = new Uint8Array([...rawData].map(char => char.charCodeAt(0)));
      const decodedString = new TextDecoder().decode(uint8Array);
      
      console.log('身份解码成功:', decodedString);

      // 解析字段
      const name = decodedString.match(/USRNAM=([^|]+)/)?.[1];
      const stfnbr = decodedString.match(/STFNBR=([^|]+)/)?.[1];

      if (!name) throw new Error("无法读取姓名");

      // --- 匹配数据库 ---
      // 注意：确保你的表里确实有 staff_id 这个字段名，否则还是用 name 匹配
      const { data: staff, error: dbError } = await supabase
        .from('staff_cache')
        .select('*')
        .or(`name.eq."${name}",staff_user_id.eq."${stfnbr}"`) 
        .maybeSingle();

      if (dbError || !staff) {
        console.error('DB Error:', dbError);
        alert(`系统名单中未找到 [${name}]，请联系管理员。`);
        isProcessing.value = false;
        return;
      }

      // --- 写入缓存 ---
      localStorage.setItem('user_info', JSON.stringify(staff));

      // --- 清理 URL 参数并跳转 ---
      // 清除地址栏那串长长的加密 data，防止刷新页面重复校验
      window.history.replaceState({}, document.title, window.location.pathname);

      // 执行角色跳转
      const isSuper = staff.dept_name === '公司管理组' || staff.name === '蔡珏侔';
      const isManager = staff.job_title?.includes('店长');

      if (isSuper) {
        router.push('/admin');
      } else if (isManager) {
        router.push('/');
      } else {
        router.push('/dashboard');
      }

    } catch (err) {
      console.error('登录流程异常:', err);
      alert('身份校验失败，请重试');
      isProcessing.value = false;
    }
  }
});
</script>