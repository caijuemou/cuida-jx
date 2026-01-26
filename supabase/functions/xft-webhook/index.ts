import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// 引入 JS 版国密库
import sm from "https://esm.sh/sm-crypto@0.3.12" 

serve(async (req) => {
  const payload = await req.json()
  const pubKey = Deno.env.get('XFT_PUB_KEY') || ""
  
  if (payload.eventId !== 'XFT00000') {
    // 1. 获取加密内容
    const encryptedData = payload.eventRcdInf
    
    // 2. 提取 SM4 密钥（公钥前32位）
    const sm4Key = pubKey.substring(0, 32)
    
    try {
      // 3. 解密数据
      const decryptedStr = sm.sm4.decrypt(encryptedData, sm4Key)
      const staffInfo = JSON.parse(decryptedStr)
      console.log("解密后的员工变动信息:", staffInfo)
      
      // 4. 这里写你的数据库逻辑：
      // 如果是离职，就从 staff_cache 删除
      // 如果是入职或变更，就 upsert 到 staff_cache
      
    } catch (e) {
      console.error("解密失败:", e)
    }
  }

  return new Response(JSON.stringify({ "rtnCod": "200", "errMsg": "" }), {
    headers: { "Content-Type": "application/json" }
  })
})
