import { createApp } from 'vue'
import './assets/tailwind.css' // 引入 Tailwind CSS
import App from './App.vue'
import router from './router' // 引入路由

const cmbTrackLib = window.cmbTrackLib

if (cmbTrackLib) {
  // 2. 初始化埋点配置
  cmbTrackLib.init({
    apiHost: 'https://xft.cmbchina.com/track', // 请参考招行给的正式环境地址
    uploadID: '0692caa6-c700-403f-8667-96cd41adfca5', // 你的 AppId
    autoTrack: true,  // 开启全量自动埋点（自动看页面跳转）
    logTrack: true,   // 开启日志监控
    apiInvoke: true   // 开启接口监控
  });

  // 3. 身份关联 (这是灵魂：解析 URL 里的加密信息并绑定用户)
  const getRequestData = () => {
    try {
      // 这里的逻辑是解析地址栏 ?data= 后的参数
      const urlParams = new URLSearchParams(window.location.search);
      const data = urlParams.get('data');
      return data ? encodeURIComponent(data.replace(/''/g, '+')) : null;
    } catch (e) {
      return null;
    }
  };

  const theRequestData = getRequestData();
  if (theRequestData) {
    cmbTrackLib.aliasID(theRequestData); // 绑定后，后台就能显示具体姓名/工号
  }

  // 4. 将埋点库挂载到 Vue 全局，方便在任何页面用 this.cmbTrackLib 调用
  app.config.globalProperties.cmbTrackLib = cmbTrackLib;
}

// 5. 错误捕获埋点 (生产环境代码报错自动上报)
app.config.errorHandler = (error) => {
  console.error('Captured Error:', error);
  if (cmbTrackLib) {
    cmbTrackLib.NgNotify_Error(error);
  }
};

createApp(App).use(router).mount('#app')
