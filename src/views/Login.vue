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
  const XFT_DOMAIN =  "https://xft.cmbchina.com";  // 生产环境用 https://xft.cmbchina.com // 如果是测试环境用 https://xft-demo.cmburl.cn
  const APP_ID = "0692caa6-c700-403f-8667-96cd41adfca5";
  const REDIRECT_URI = encodeURIComponent(window.location.origin + "/login");
  const STATE = Date.now().toString();
  
  const authUrl = `${XFT_DOMAIN}/xft-gateway/xft-login-new/xwapi/oauth/authorize?app_id=${APP_ID}&redirect_uri=${REDIRECT_URI}&state=${STATE}`;
  
  window.location.href = authUrl;
};

// 2. 处理回调：检测 URL 里的 data 参数
onMounted(async () => {
  const params = new URLSearchParams(window.location.search);
  const data = params.get('data');

  if (data) {
    isProcessing.value = true;
    try {
      // 1. 前端直接解码 data
      // 薪福通的 data 是标准 Base64，但可能有 URL 安全字符替换
      const decodedString = decodeURIComponent(escape(window.atob(data.replace(/-/g, '+').replace(/_/g, '/'))));
      console.log('解码后的数据:', decodedString);

      // 2. 从字符串中解析出姓名 (USRNAM) 和 工号 (STFNBR)
      // 你的 URL 里包含: USRNAM=蔡珏侔, STFNBR=CD000023
      const nameMatch = decodedString.match(/USRNAM=([^|]+)/);
      const name = nameMatch ? nameMatch[1] : null;
      
      const stfMatch = decodedString.match(/STFNBR=([^|]+)/);
      const stfnbr = stfMatch ? stfMatch[1] : null;

      if (!name) throw new Error("无法识别用户信息");

      // 3. 直接用姓名和工号去匹配你的 staff_cache 表
      // 建议优先用工号匹配，因为姓名可能重复
      const { data: staff, error: dbError } = await supabase
        .from('staff_cache')
        .select('*')
        .eq('name', name) // 如果你有工号字段，改为 .eq('staff_id', stfnbr) 会更准
        .single();

      if (dbError || !staff) {
        alert(`登录成功，但在考评名单中未找到: ${name}`);
        isProcessing.value = false;
        return;
      }

      // 4. 核心：保存 Session 到本地
      localStorage.setItem('user_info', JSON.stringify(staff));

      // 5. 跳转逻辑
      if (staff.dept_name === '公司管理组' || staff.name === '蔡珏侔') {
        router.push('/admin');
      } else if (staff.job_title?.includes('店长')) {
        router.push('/');
      } else {
        router.push('/dashboard');
      }

    } catch (err) {
      console.error('解码失败:', err);
      alert('身份校验异常，请尝试重新登录');
      isProcessing.value = false;
    }
  }
});
</script>