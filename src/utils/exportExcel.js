// 统一 Excel 导出工具（跨端兼容）
//
// 背景（手机端导出乱码 / 报「未找到浏览器」的根因）：
//   1) 移动端内嵌浏览器（薪福通 / 微信 / 企业微信 / 钉钉等）不支持 blob: URL 下载，
//      安卓会直接弹系统提示「抱歉，未找到浏览器」；
//   2) iOS Safari 对 blob + a.download 不触发下载，会把 xlsx 的二进制当网页文本渲染（满屏乱码）；
// 因此按运行环境分流：
//   桌面浏览器    -> 直接下载（行为完全不变，不经任何服务端）
//   iOS / iPadOS  -> 系统分享面板，用户可「存储到文件」
//   安卓标准浏览器 -> 直接下载到下载目录
//   安卓 App 内嵌  -> 表单 POST 到 Edge Function「export-perf」，由它返回 attachment 触发系统下载
//   全部失败      -> 友好提示，引导到浏览器再导出
//
// 为什么用「表单 POST + Edge Function」而不是 Storage 直链：
//   不需要建 bucket、不需要 RLS policy、不占存储配额，且 base64 走 POST body 没有 URL 长度限制。
import * as XLSX from 'xlsx'

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

// 导出函数（Edge Function），需在 supabase Dashboard 关闭其 Verify JWT
const EXPORT_FN_URL = 'https://ubvhtmsqifyuhcjidirx.supabase.co/functions/v1/export-perf'

const ua = () => navigator.userAgent || ''

export const isIOSDevice = () =>
  /iPhone|iPad|iPod/i.test(ua()) ||
  // iPadOS 13+ 的 UA 伪装成 Macintosh，用触摸点数补判，否则会漏判成桌面（又变乱码）
  (/Macintosh/i.test(ua()) && (navigator.maxTouchPoints || 0) > 1)

export const isMobileDevice = () => /iPhone|iPad|iPod|Android|Mobile|Silk/i.test(ua())

// 已知对 blob 下载支持很差的内嵌浏览器
const isInnerBrowser = () =>
  /MicroMessenger|wxwork|DingTalk|QQBrowser|UCBrowser|UCWEB|Quark|Baidu|360SE|SogouMobile|CmbChina|CMB|XFT/i.test(ua())

// 本地日期 YYYY-MM-DD（不用 toISOString，那是 UTC，凌晨会差一天）
export const formatLocalDate = (d = new Date()) => {
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

const guideToExternalBrowser = () => {
  alert(
    '当前环境不支持直接保存文件。\n\n' +
    '请点右上角「···」→「在浏览器中打开」，再点「导出报表」。\n' +
    '（iPhone 可长按页面链接，选择「在 Safari 中打开」）'
  )
}

const anchorDownload = (blob, fileName) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}

// ArrayBuffer -> base64（分块处理，避免 String.fromCharCode 参数过多）
const arrayBufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer)
  const chunk = 0x8000
  let binary = ''
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

// 以「表单 POST」提交到导出函数。
// 表单提交属于浏览器导航行为，响应带 Content-Disposition: attachment 时会直接触发下载，
// 且不会离开当前页面（blob / data 方案都做不到这点）。
const postFormDownload = (url, fields) => {
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = url
  form.style.display = 'none'
  Object.entries(fields).forEach(([name, value]) => {
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = name
    input.value = value
    form.appendChild(input)
  })
  document.body.appendChild(form)
  form.submit()
  document.body.removeChild(form)
}

// 安卓 App 内：先探活确认函数可用，再提交表单
const tryFunctionDownload = async (blob, fileName) => {
  try {
    const probe = await fetch(EXPORT_FN_URL, { method: 'GET' })
    if (!probe.ok) {
      console.warn('[export] 导出函数探活失败:', probe.status)
      return false
    }
  } catch (err) {
    console.warn('[export] 无法连接导出函数:', err?.message)
    return false
  }
  try {
    const contentBase64 = arrayBufferToBase64(await blob.arrayBuffer())
    postFormDownload(EXPORT_FN_URL, { filename: fileName, contentBase64 })
    return true
  } catch (err) {
    console.warn('[export] 提交导出表单失败:', err?.message)
    return false
  }
}

/**
 * 导出 Excel（自动适配桌面 / iOS / 移动端内嵌浏览器）
 * @param {Object} workbook SheetJS workbook
 * @param {string} fileName 文件名（含 .xlsx）
 */
export const downloadExcel = async (workbook, fileName) => {
  const arrayBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([arrayBuffer], { type: XLSX_MIME })

  // 1) 桌面浏览器：直接下载（保持原有行为）
  if (!isMobileDevice()) {
    if (navigator.msSaveBlob) {
      navigator.msSaveBlob(blob, fileName)
      return
    }
    anchorDownload(blob, fileName)
    return
  }

  // 2) iOS / iPadOS：系统分享面板保存到「文件」（不要用 blob 打开，否则会渲染成乱码）
  if (isIOSDevice()) {
    const file = new File([blob], fileName, { type: XLSX_MIME })
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: fileName })
        return
      } catch (err) {
        if (err && err.name === 'AbortError') return   // 用户主动取消
        // 其他失败（如手势失效）-> 继续往下走函数下载方案
      }
    }
  }

  // 3) 安卓标准浏览器：直接下载
  if (/Chrome/i.test(ua()) && !isInnerBrowser()) {
    anchorDownload(blob, fileName)
    return
  }

  // 4) 安卓 App 内嵌（薪福通/微信/企微/钉钉等）：表单 POST -> export-perf 返回附件
  const submitted = await tryFunctionDownload(blob, fileName)
  if (submitted) return

  // 5) 兜底：提示引导
  guideToExternalBrowser()
}
