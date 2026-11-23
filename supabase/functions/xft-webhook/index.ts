// ============================================================================
// xft-webhook —— 薪福通事件回调入口（生产运行版本）
//
// 2026-11-20 更新为「并行触发 + 立即响应」版：
//   原先串行 await(cmb-sync) → await(special-manager-sync)，总耗时 = t1 + t2，
//   第一个慢/挂住会连带第二个永不发出，且容易超过薪福通回调超时（表现为
//   「事件推送失败」通知）。现改为两个请求同时发出，waitUntil 托管后台任务，
//   对薪福通的响应降到 20~50ms。
//
// 说明：更早还有一版是「SM4 解密 eventRcdInf → 直接 upsert staff_cache」的
// 单员工同步实现，该职责已被 cmb-sync（全量同步）覆盖，此逻辑已废弃。
// ============================================================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const CMB_SYNC_URL = "https://ubvhtmsqifyuhcjidirx.supabase.co/functions/v1/cmb-sync"
const MANAGER_SYNC_URL = "https://ubvhtmsqifyuhcjidirx.supabase.co/functions/v1/special-manager-sync"

serve(async (req) => {
  try {
    const payload = await req.json()
    const { eventId } = payload

    // 1. 薪福通连通性测试，直接返回（不触发任何同步）
    if (eventId === 'XFT00000') {
      return new Response(JSON.stringify({ rtnCod: "200", errMsg: "" }), { status: 200 })
    }

    console.log(`[Webhook] 收到事件: ${eventId}，并行触发两个同步...`)
    const API_KEY = Deno.env.get('SUPABASE_ANON_KEY') || ""

    // 2. 两个同步【同时】发出，互不阻塞；各自失败只记日志，不影响另一个
    const trigger = (url: string, tag: string) =>
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: API_KEY },
        body: JSON.stringify({ trigger_by: eventId })
      })
        .then(r => console.log(`[Webhook] ${tag} 响应状态: ${r.status}`))
        .catch(e => console.error(`[Webhook] 请求 ${tag} 失败: ${e.message}`))

    const jobs = Promise.allSettled([
      trigger(CMB_SYNC_URL, 'cmb-sync'),
      trigger(MANAGER_SYNC_URL, 'special-manager-sync')
    ])

    // 3. 有 EdgeRuntime.waitUntil 就交给 runtime 后台跑完，立刻回 200；
    //    没有就并行等待（总耗时 = max，仍远好于串行）
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      EdgeRuntime.waitUntil(jobs)
      return new Response(JSON.stringify({ rtnCod: "200", errMsg: "同步任务已触发" }), { status: 200 })
    }

    await jobs
    return new Response(JSON.stringify({ rtnCod: "200", errMsg: "同步任务已触发" }), { status: 200 })
  } catch (err) {
    console.error("❌ Webhook 转发异常:", err.message)
    return new Response(JSON.stringify({ rtnCod: "200", errMsg: err.message }), { status: 200 })
  }
})
