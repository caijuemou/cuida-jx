// 统一 Excel 导出工具（跨端兼容）
//
// 背景（手机端导出乱码 / 报「未找到浏览器」的根因）：
//   1) 移动端内嵌浏览器（薪福通 / 微信 / 企业微信 / 钉钉等）不支持 blob: URL 下载，
//      安卓会直接弹系统提示「抱歉，未找到浏览器」；
//   2) iOS Safari 对 blob + a.download 不触发下载，会把 xlsx 的二进制当网页文本渲染（满屏乱码）；
// 因此按运行环境分流：
//   桌面浏览器    -> 直接下载（行为完全不变）
//   iOS / iPadOS  -> 系统分享面板，用户可「存储到文件」
//   安卓标准浏览器 -> 直接下载到下载目录
//   安卓 App 内嵌  -> Supabase Storage 签名直链（浏览器自己发起 https 请求 -> 系统原生下载）
//   全部失败      -> 复制下载链接，提示在（电脑）浏览器打开
import * as XLSX from 'xlsx'
import { supabase } from '../composables/useSupabase'

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
const EXPORT_BUCKET = 'exports'
const SIGN_URL_TTL = 3600   // 签名链接有效期 1 小时

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

// Storage 的 object key 只允许安全字符，中文文件名改用 ASCII key，
// 真正的中文文件名通过签名 URL 的 download 参数下发
const safeKey = () => {
  const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)
  return `export_${stamp}_${Math.random().toString(36).slice(2, 8)}.xlsx`
}

/**
 * 上传到 Storage 并换取带下载响应头的签名直链。
 * 浏览器导航到该地址 -> 服务端返回 Content-Disposition: attachment -> 系统原生下载。
 * @returns {Promise<string|null>} 签名直链；任何环节失败返回 null（走后续降级）
 */
const getStorageSignedLink = async (blob, fileName, userId) => {
  try {
    const key = `${userId ? userId + '/' : ''}${safeKey()}`
    const { error: upErr } = await supabase.storage
      .from(EXPORT_BUCKET)
      .upload(key, blob, { contentType: XLSX_MIME, upsert: false })
    if (upErr) {
      console.warn('[export] Storage 上传失败（bucket 或 insert policy 未配置？）:', upErr.message)
      return null
    }
    const { data, error: signErr } = await supabase.storage
      .from(EXPORT_BUCKET)
      .createSignedUrl(key, SIGN_URL_TTL, { download: fileName })
    if (signErr) {
      console.warn('[export] 生成签名链接失败:', signErr.message)
      return null
    }
    return data?.signedUrl || null
  } catch (err) {
    console.warn('[export] Storage 直链异常:', err?.message)
    return null
  }
}

const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch { /* 落到下面的 prompt */ }
  try {
    window.prompt('请复制以下下载链接（在电脑浏览器中打开即可下载）：', text)
    return true
  } catch { return false }
}

/**
 * 导出 Excel（自动适配桌面 / iOS / 移动端内嵌浏览器）
 * @param {Object} workbook SheetJS workbook
 * @param {string} fileName 文件名（含 .xlsx）
 * @param {Object} [options] { userId } 用于 Storage 目录隔离
 */
export const downloadExcel = async (workbook, fileName, options = {}) => {
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
        // 其他失败（如手势失效）-> 继续往下走直链方案
      }
    }
  }

  // 3) 安卓标准浏览器：直接下载
  if (/Chrome/i.test(ua()) && !isInnerBrowser()) {
    anchorDownload(blob, fileName)
    return
  }

  // 4) 安卓 App 内嵌（薪福通/微信/企微/钉钉等）：走 Storage 签名直链
  const link = await getStorageSignedLink(blob, fileName, options.userId)
  if (link) {
    const opened = window.open(link, '_blank')
    if (opened) return                    // 新标签打开 -> 服务端返回 attachment -> 系统原生下载
    const copied = await copyToClipboard(link)
    if (copied) {
      alert('下载链接已复制。\n\n请粘贴到浏览器（或电脑浏览器）中打开该链接，即可下载文件。')
      return
    }
  }

  // 5) 兜底：提示引导
  guideToExternalBrowser()
}
