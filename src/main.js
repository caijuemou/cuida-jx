import { createApp } from 'vue'
import './assets/tailwind.css'
import App from './App.vue'
import router from './router'

const app = createApp(App)

// 关键：检查埋点 SDK 是否真的加载成功了
const cmbTrackLib = window.cmbTrackLib

if (cmbTrackLib && typeof cmbTrackLib.init === 'function') {
  try {
    cmbTrackLib.init({
      apiHost: 'https://lf12-32-gateway.paas.cmbchina.com/front-rest-log/v2/encrypt_upload', // 请确认文档地址
      uploadID: '0692caa6-c700-403f-8667-96cd41adfca5',
      autoTrack: true,
      logTrack: true,
      apiInvoke: true,
      defaultErrorCode: '9999'
    });

    const urlParams = new URLSearchParams(window.location.search);
    const data = urlParams.get('data');
    if (data) {
      const theRequestData = encodeURIComponent(data.replace(/''/g, '+'));
      cmbTrackLib.aliasID(theRequestData);
    }
    
    // 挂载到全局
    app.config.globalProperties.cmbTrackLib = cmbTrackLib;
  } catch (err) {
    console.warn('埋点初始化失败，但不影响系统运行:', err);
  }
} else {
  console.warn('未检测到 cmbTrackLib SDK，埋点功能已跳过');
}

app.use(router).mount('#app')
