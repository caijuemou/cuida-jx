import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 北京时间当天 YYYY-MM-DD
// 注意：Deno 运行时默认 UTC，new Date().toISOString() 在北京时间凌晨 0-8 点会得到昨天，
// 因此这里手动 +8h 偏移后再取 UTC 字段。
const todayCN = () => {
  const d = new Date(Date.now() + 8 * 3600 * 1000)
  const p = n => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. 获取打分页传来的实时数据
    // 传入: { staffId, score, desc, detailReason, starterId, recordDate }
    const { staffId, score, desc, detailReason, starterId, recordDate } = await req.json();

    // 2. 从 staff_cache 动态检索该员工及其发起人的完整背景信息
    const { data: users, error: userError } = await supabase
      .from('staff_cache')
      .select('*')
      .in('xft_user_id', [staffId, starterId]);

    if (userError || !users) throw new Error("无法在 staff_cache 中找到相关人员数据");
    const staff = users.find(u => u.xft_user_id === staffId);
    const starter = users.find(u => u.xft_user_id === starterId);
    if (!staff || !starter) throw new Error("匹配员工或发起人失败");

    // 3. 构造符合薪福通标准中间格式的业务数据 (oriData)
    const oriData = {
      "9sw0qnkqgb3s": [{
        "USRNAM": staff.name,
        "USRNBR": staff.xft_user_id,
        "STFNBR": staff.staff_number,
        "STFSEQ": staff.staff_seq
      }],
      "w1q30g3l167x": [{
        "ORGNAM": staff.dept_name,
        "ORGSEQ": staff.dept_id
      }],
      "6yf9rk1wiuhc": staff.job_title,
      "5v02cokw111m": desc,
      "7zni9mi8prqb": Number(score),
      "4jtqb8iyg325": detailReason,
      "hbfwjqhxvkn3": [{ "USRNAM": starter.name, "USRNBR": starter.xft_user_id }],
      // ★ 日期组件：优先用打分页传来的「考核日期」，缺省回落到北京时间当天
      "ya9xjl27tg2j": recordDate || todayCN()
    };

    const xftPayload = {
      starterId: starter.xft_user_id,
      procStartType: "trialStart",
      formKey: "AAB59764_NFORM_350506414114275402",
      formData: JSON.stringify(oriData)
    };

    // 4. 调用网关转发至薪福通
    const GATEWAY_URL = "https://ubvhtmsqifyuhcjidirx.supabase.co/functions/v1/cmb-gateway";
    const API_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const response = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': API_KEY },
      body: JSON.stringify({
        path: "/xft-oa/openapi/xft-newform/open/form-start",
        method: "POST",
        payload: xftPayload
      })
    });

    const result = await response.json();
    return new Response(JSON.stringify({ success: true, xftResponse: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }
})
