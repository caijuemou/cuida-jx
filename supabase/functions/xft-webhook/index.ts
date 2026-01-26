import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import sm from "https://esm.sh/sm-crypto@0.3.12"

serve(async (req) => {
  try {
    const payload = await req.json()
    
    // 初始化 Supabase 客户端
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. 处理连接测试
    if (payload.eventId === 'XFT00000') {
      return new Response(JSON.stringify({ "rtnCod": "200", "errMsg": "" }), { status: 200 })
    }

    // 2. 解密正式数据 (eventRcdInf 或 event_message)
    const encryptedData = payload.eventRcdInf || payload.event_message
    const pubKey = Deno.env.get('XFT_PUB_KEY') || ""
    const sm4Key = pubKey.substring(0, 32)
    
    const decryptedStr = sm.sm4.decrypt(encryptedData, sm4Key)
    const info = JSON.parse(decryptedStr)

    // 3. 映射为数据库格式
    const staffData = {
      xft_user_id: info.STFNBR,
      name: info.STFNAM,
      dept_name: info.ORGNAM, // 这里直接拿到了中文名，无需再查字典！
      job_title: info.POSNAM, // 这里直接拿到了中文名！
      mobile: info.MOBNBR,
      last_sync_at: new Date().toISOString()
    }

    console.log(`🚀 准备更新员工: ${staffData.name}`)

    // 4. 写入数据库
    const { error } = await supabase
      .from('staff_cache')
      .upsert(staffData, { onConflict: 'xft_user_id' })

    if (error) throw error

    return new Response(JSON.stringify({ "rtnCod": "200", "errMsg": "" }), { status: 200 })

  } catch (err) {
    console.error("同步失败:", err.message)
    // 即使失败也给招行返回200，防止其不断重试，但我们在Log里记录错误
    return new Response(JSON.stringify({ "rtnCod": "200", "errMsg": err.message }), { status: 200 })
  }
})
