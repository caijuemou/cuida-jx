import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-client@2'

serve(async (req) => {
  try {
    // 1. 获取招行推送的 Body
    const { eventType, data } = await req.json()

    // 2. 初始化 Supabase 客户端
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log(`收到事件: ${eventType}`, data)

    // 3. 处理不同类型的事件 (例如: 人员入职/变动)
    // 注意：招行推送通常只给 stfSeq (人员流水号)，需要反查详细信息
    if (eventType === 'STAFF_INFO_UPDATE' || eventType === 'STAFF_JOIN') {
      const stfSeq = data.stfSeq
      
      // 这里建议：调用你之前的获取人员详情的逻辑，或者标记该人员需要更新
      // 简单处理：你可以直接更新对应人员的同步状态，或者直接在函数里请求一次招行接口
      
      console.log(`人员 ${stfSeq} 已变动，准备同步...`)
    }

    // 4. 必须按招行要求返回响应
    return new Response(
      JSON.stringify({ returnCode: "SUC0000", errorMsg: null }),
      { headers: { "Content-Type": "application/json" } }
    )

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
