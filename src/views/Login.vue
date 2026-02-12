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

      // 2. 解析字段 (严格对应日志中的 Key)
      const name = decodedString.match(/USRNAM=([^|]+)/)?.[1]?.trim();
      const stfnbr = decodedString.match(/STFNBR=([^|]+)/)?.[1]?.trim(); // 得到 "CD000023"
      // const stfseq = decodedString.match(/STFSEQ=([^|]+)/)?.[1]?.trim(); // 如果需要，这样定义 stfseq

      if (!name || !stfnbr) throw new Error("无法读取用户信息");

      // 3. 匹配数据库
      let staff = null;

      // 策略 A: 尝试【完全匹配】 (对应数据库里存了 "CD000023" 的情况)
      const { data: byId } = await supabase
        .from('staff_cache')
        .select('*')
        .eq('staff_number', stfnbr) // 确认你的列名是 staff_number 还是 xft_user_id
        .maybeSingle();
      
      staff = byId;

      // 策略 B: 如果没中，尝试【去除前缀和零】的模糊匹配
      // 比如把 "CD000023" 变成 "23"，去查数据库
      if (!staff) {
        const shortId = stfnbr.replace(/\D/g, '').replace(/^0+/, ''); // 提取数字并去前导零，得到 "23"
        const { data: byShortId } = await supabase
          .from('staff_cache')
          .select('*')
          .ilike('staff_number', `%${shortId}`) // 匹配以 "23" 结尾的工号
          .maybeSingle();
        staff = byShortId;
      }

      // 策略 C: 姓名匹配
      if (!staff) {
        const { data: byName } = await supabase
          .from('staff_cache')
          .select('*')
          .eq('name', name)
          .maybeSingle();
        staff = byName;
      }

      if (!staff) {
        alert(`未在系统名单找到：\n姓名：${name}\n工号：${stfnbr}\n\n请联系后台管理员核对工号格式！`);
        isProcessing.value = false;
        return;
      }

      // 4. 登录成功处理
      sessionStorage.setItem('user_info', JSON.stringify(staff));
      window.history.replaceState({}, document.title, window.location.pathname);

      // 跳转逻辑...
      const isSuper = staff.dept_name === '公司管理组' || staff.name === '蔡珏侔';
      if (isSuper) router.push('/admin');
      else router.push('/');

    } catch (err) {
      console.error('登录校验异常:', err);
      alert('登录失败：' + err.message);
      isProcessing.value = false;
    }
  }
});

</script>



