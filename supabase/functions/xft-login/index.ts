// supabase/functions/xft-login/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const APP_ID = "0692caa6-c700-403f-8667-96cd41adfca5"; // 薪福通分配的应用ID
const XFT_API_URL = "https://api.cmbchina.com/common/api/common/common/OPSYTKLG";

serve(async (req) => {
  try {
    const { data } = await req.json();
    
    // 1. 从 data 中解析出 TKNNBR
    // data 格式示例: TKNNBR=XXXX|REQTIM=123|OPAUID=itrip...
    const decodedData = atob(data); 
    const tknnbr = decodedData.split('|')
      .find(item => item.startsWith('TKNNBR='))
      ?.split('=')[1];

    if (!tknnbr) throw new Error("无效的 Token 信息");

    // 2. 构造薪福通要求的请求报文
    const payload = {
      "SYCOMOPAY": [
        {
          "SESTKN": tknnbr,
          "OPAUID": APP_ID
        }
      ]
    };

    // 3. 发起验证请求
    const response = await fetch(XFT_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    // 4. 解析用户信息 (取第一个用户信息)
    const userInfo = result.OPUSINFOY?.[0];
    
    if (!userInfo || result.SYCOMRETZ?.[0]?.ERRCOD !== "0000000") {
      throw new Error(result.SYCOMRETZ?.[0]?.ERRMSG || "验证失败");
    }

    // 返回给前端
    return new Response(JSON.stringify({
      success: true,
      user: {
        name: userInfo.USRNAM,
        mobile: userInfo.MBLNBR,
        enterpriseId: userInfo.PRJCOD,
        userId: userInfo.USRNBR,
        role: userInfo.USRTYP // P为管理员, E为普通用户
      }
    }), { headers: { "Content-Type": "application/json" } });

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 400 });
  }
})