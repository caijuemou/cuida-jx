// supabase/functions/xft-login/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const APP_ID = "0692caa6-c700-403f-8667-96cd41adfca5"; // 薪福通分配的应用ID
const XFT_API_URL = "https://api.cmbchina.com/common/api/common/common/OPSYTKLG";

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { data } = await req.json();
    
    // 1. 安全解码 (处理 URL 安全字符)
    const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
    const decodedData = atob(base64); 
    
    // 2. 正则提取 TKNNBR
    const tknnbr = decodedData.match(/TKNNBR=([^|]+)/)?.[1];

    if (!tknnbr) throw new Error("无效的 Token 信息");

    // 3. 构造报文
    const payload = {
      "SYCOMOPAY": [{ "SESTKN": tknnbr, "OPAUID": APP_ID }]
    };

    // 4. 发起验证
    const response = await fetch(XFT_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    const userInfo = result.OPUSINFOY?.[0];
    
    if (!userInfo || result.SYCOMRETZ?.[0]?.ERRCOD !== "0000000") {
      throw new Error(result.SYCOMRETZ?.[0]?.ERRMSG || "招行验证未通过");
    }

    return new Response(JSON.stringify({
      success: true,
      user: {
        name: userInfo.USRNAM,
        mobile: userInfo.MBLNBR,
        enterpriseId: userInfo.PRJCOD,
        userId: userInfo.USRNBR,
        role: userInfo.USRTYP // P为管理员, E为普通用户
      }
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { 
      status: 200, // 为了前端好捕获，建议返回 200 带 success: false
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
})