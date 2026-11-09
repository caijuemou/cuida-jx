// 统一 Excel 导出工具（跨端兼容）
//
// 背景（手机端导出乱码 / 报「未找到浏览器」的根因）：
//   1) 移动端内嵌浏览器（薪福通 / 微信 / 企业微信 / 钉钉 / UC / QQ 等）不支持 blob: URL 下载，
//      安卓会直接弹系统提示「抱歉，未找到浏览器」；
//   2) iOS Safari 对 blob + a.download 不触发下载，会把 xlsx 的二进制当网页文本渲染（满屏乱码）；
// 因此按运行环境分流：
//   桌面浏览器  -> 直接下载（原行为，完全不变）
//   iOS         -> 系统分享面板，用户可「存储到文件」
//   移动端内嵌  -> 友好提示，引导到外部浏览器再导出
import * as XLSX from 'xlsx'

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

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

  // 2) iOS：用系统分享面板保存到「文件」（不要用 blob 打开，否则会渲染成乱码）
  if (isIOSDevice()) {
    const file = new File([blob], fileName, { type: XLSX_MIME })
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: fileName })
        return
      } catch (err) {
        if (err && err.name === 'AbortError') return   // 用户主动取消
        // 其他失败（如手势失效）→ 落到下面的引导提示
      }
    }
    guideToExternalBrowser()
    return
  }

  // 3) 安卓：标准 Chrome 直接下载；内嵌浏览器引导到外部浏览器
  if (/Chrome/i.test(ua()) && !isInnerBrowser()) {
    anchorDownload(blob, fileName)
    return
  }
  guideToExternalBrowser()
}
