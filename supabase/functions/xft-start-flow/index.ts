// supabase/functions/xft-start-flow/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { record } = await req.json();

    // 映射我们数据库字段到薪福通 uniqueName
    const formDataObj = {
      "b225oqdzhuqy": [{ "ORGNAM": record.target_dept_name }], // 门店
      "xg1ch4bqcqpn": [{ "USRNAM": record.target_name, "USRNBR": record.target_user_id }], // 员工姓名
      "bfjes3lkguau": [{ "PSTNAM": record.target_job_title }], // 岗位
      "t5oizk5770in": { "label": record.category_label }, // 考核项
      "3xa5aazsopc2": record.score_value, // 扣分值
      "f2eji23vnx3p": record.description, // 具体描述
      "m2avoan1pjo5": record.record_date   // 日期
    };

    const payload = {
      "formKey": "AAB59764_NFORM_344042707364216833",
      "procStartType": "start",
      "busKey": `PERF_${record.id}`, // 使用本地记录ID作为业务编号
      "formData": JSON.stringify(formDataObj),
      "starterId": record.starter_id // 发起人工号
    };

    // 调用正式环境地址
    const response = await fetch("https://api.cmbchina.com/xft-oa/openapi/xft-newform/open/form-start", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const xftResult = await response.json();
    return new Response(JSON.stringify(xftResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 400, 
      headers: corsHeaders 
    });
  }
})