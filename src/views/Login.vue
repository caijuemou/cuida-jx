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

// 1. 发起登录
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
      // 1. 解码
      const rawData = window.atob(data.replace(/-/g, '+').replace(/_/g, '/'));
      const uint8Array = new Uint8Array([...rawData].map(char => char.charCodeAt(0)));
      const decodedString = new TextDecoder().decode(uint8Array);
      
      console.log('身份解码成功:', decodedString);

      // 2. 解析核心字段 (注意 Key 必须完全匹配日志)
      const xftName = decodedString.match(/USRNAM=([^|]+)/)?.[1]?.trim();
      const xftStfnbr = decodedString.match(/STFNBR=([^|]+)/)?.[1]?.trim();
      const xftSeq = decodedString.match(/STFSEQ=([^|]+)/)?.[1]?.trim(); // 对应你的 staff_seq

      // 3. 增强匹配逻辑
      let staff = null;

      // 策略 A: 优先使用 staff_seq 匹配 (这是最稳妥的唯一标识)
      if (xftSeq) {
        const { data: resSeq } = await supabase
          .from('staff_cache')
          .select('*')
          .eq('staff_seq', xftSeq)
          .limit(1);
        staff = resSeq?.[0];
      }

      // 策略 B: 如果 Seq 没中，用工号模糊匹配 (解决 CD00023 vs CD000023)
      if (!staff && xftStfnbr) {
        // 提取纯数字部分，比如从 CD000023 提取出 23
        const pureNumber = xftStfnbr.replace(/\D/g, '').replace(/^0+/, '');
        const { data: resId } = await supabase
          .from('staff_cache')
          .select('*')
          .ilike('staff_number', `%${pureNumber}`)
          .limit(1);
        staff = resId?.[0];
      }

      // 策略 C: 姓名匹配
      if (!staff && xftName) {
        const { data: resName } = await supabase
          .from('staff_cache')
          .select('*')
          .eq('name', xftName)
          .limit(1);
        staff = resName?.[0];
      }

      // 4. 判定与状态处理
      if (!staff) {
        throw new Error(`系统名单未收录：${xftName} (${xftStfnbr})`);
      }

      // 【重要】检查是否离职，如果是离职状态给出提示但允许进入（或根据业务拦截）
      if (staff.is_active === false) {
        console.warn('警告：该账号在系统中处于非激活状态');
      }

      // 5. 存储并跳转
      localStorage.setItem('user_info', JSON.stringify(staff));
      
      // 清理 URL
      window.history.replaceState({}, document.title, window.location.pathname);

      // 角色跳转
      const isSuper = staff.dept_name?.includes('管理组') || staff.name === '蔡珏侔';
      if (isSuper) {
        router.push('/admin');
      } else {
        router.push('/');
      }

    } catch (err) {
      console.error('登录异常:', err);
      alert(err.message || '身份校验失败');
      isProcessing.value = false;
    }
  }
});

</script>






