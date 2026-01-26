import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  try {
    // 薪福通推送是 POST 请求
    if (req.method !== 'POST') {
      return new Response("Method Not Allowed", { status: 405 })
    }

    const payload = await req.json()
    console.log("收到薪福通事件:", payload.eventId)

    // --- 核心逻辑：响应连接测试 (XFT00000) ---
    // 无论是测试还是正式事件，文档要求的成功返回格式都是这个
    const successResponse = {
      "rtnCod": "200",
      "errMsg": ""
    }

    // 这里处理业务逻辑 (比如记录到数据库)
    if (payload.eventId === 'XFT00000') {
       console.log("连接测试通过")
    } else {
       // 正式事件处理...
       console.log("处理正式业务事件:", payload.businessKey)
    }

    return new Response(
      JSON.stringify(successResponse),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json; charset=utf-8" } 
      }
    )

  } catch (err) {
    console.error("处理失败:", err.message)
    return new Response(
      JSON.stringify({ "rtnCod": "500", "errMsg": err.message }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  }
})
