import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

serve(async (req) => {
  try {
    // 招行初次配置回调地址时，可能会发一个简单的 GET 请求验证接口存活
    if (req.method === 'GET') {
      return new Response("Webhook is active!", { status: 200 })
    }

    const payload = await req.json()
    console.log("收到招行推送数据:", payload)

    // 返回招行要求的成功响应格式
    return new Response(
      JSON.stringify({ returnCode: "SUC0000", errorMsg: null }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400 })
  }
})
