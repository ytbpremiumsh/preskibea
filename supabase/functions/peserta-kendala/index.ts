import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const reply = (status: number, body: object) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" } });
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const bucket = "peserta-kendala";
const MAX_IMAGE = 2 * 1024 * 1024;

function imageType(bytes: Uint8Array): {type:string; ext:string} | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return {type:"image/jpeg",ext:"jpg"};
  if (bytes.length >= 8 && [137,80,78,71,13,10,26,10].every((n,i) => bytes[i] === n)) return {type:"image/png",ext:"png"};
  if (bytes.length >= 12 && new TextDecoder().decode(bytes.slice(0,4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8,12)) === "WEBP") return {type:"image/webp",ext:"webp"};
  return null;
}

Deno.serve(async req => {
  if(req.method === "OPTIONS") return new Response(null,{headers:cors});
  if(req.method !== "POST") return reply(405,{ok:false,error:"method_not_allowed"});
  try {
    // A persisted rate limit is shared by all function instances. The gateway provides cf-connecting-ip.
    const ip = req.headers.get("cf-connecting-ip") ?? "unknown";
    const digest = await crypto.subtle.digest("SHA-256",new TextEncoder().encode(`peserta-kendala:${ip}`));
    const ipHash = Array.from(new Uint8Array(digest)).map(v=>v.toString(16).padStart(2,"0")).join("");
    const {data: allowed,error: rateError} = await db.rpc("peserta_rate_limit",{p_key:ipHash});
    if(rateError || !allowed) return reply(429,{ok:false,error:"rate_limited"});
    let action="", token="", subject="", message="", reportId="", file:File|null=null;
    if((req.headers.get("content-type") ?? "").includes("multipart/form-data")) {
      const declared = Number(req.headers.get("content-length") ?? 0);
      if(declared > MAX_IMAGE + 100_000) return reply(413,{ok:false,error:"file_too_large"});
      const form=await req.formData(); action=String(form.get("action")??""); token=String(form.get("token")??""); subject=String(form.get("subject")??"").trim(); message=String(form.get("message")??"").trim(); const item=form.get("image"); if(item instanceof File && item.size) file=item;
    } else {
      const input=await req.json(); action=String(input?.action??""); token=String(input?.token??""); reportId=String(input?.report_id??"");
    }
    token=token.trim().toUpperCase();
    if(!/^(PK|KP)-(PRE|EKO|UMU|YAT)-[A-Z0-9]{4,10}$/.test(token)) return reply(400,{ok:false,error:"invalid_request"});
    const {data: settings,error: settingError}=await db.from("site_settings").select("value").eq("key","peserta_dashboard").maybeSingle();
    if(settingError) throw settingError;
    if(settings?.value?.reports_enabled === false) return reply(403,{ok:false,error:"disabled"});
    const {data: reg,error: regError}=await db.from("registrations").select("id").eq("token",token).maybeSingle();
    if(regError) throw regError;
    if(!reg) return reply(404,{ok:false,error:"not_found"});
    if(action === "list") {
      const {data,error}=await db.from("peserta_reports").select("id,subject,message,status,admin_reply,created_at,image_path").eq("registration_id",reg.id).order("created_at",{ascending:false}).limit(100);
      if(error) throw error;
      return reply(200,{ok:true,reports:(data??[]).map(({image_path,...r})=>({...r,has_image:!!image_path}))});
    }
    if(action === "image") {
      if(!/^[0-9a-f-]{36}$/i.test(reportId)) return reply(400,{ok:false,error:"invalid_request"});
      const {data,error}=await db.from("peserta_reports").select("image_path").eq("id",reportId).eq("registration_id",reg.id).maybeSingle();
      if(error) throw error;
      if(!data?.image_path) return reply(404,{ok:false,error:"not_found"});
      const result=await db.storage.from(bucket).createSignedUrl(data.image_path,60);
      if(result.error || !result.data?.signedUrl) throw result.error;
      return reply(200,{ok:true,url:result.data.signedUrl});
    }
    if(action !== "submit" || !subject || subject.length>120 || !message || message.length>4000) return reply(400,{ok:false,error:"invalid_request"});
    const {count,error: countError}=await db.from("peserta_reports").select("id",{count:"exact",head:true}).eq("registration_id",reg.id).gte("created_at",new Date(Date.now()-60_000).toISOString());
    if(countError) throw countError;
    if((count??0)>=3) return reply(429,{ok:false,error:"rate_limited"});
    let path:string|null=null;
    if(file) {
      if(file.size>MAX_IMAGE) return reply(413,{ok:false,error:"file_too_large"});
      const bytes=new Uint8Array(await file.arrayBuffer()), type=imageType(bytes);
      if(!type || type.type!==file.type) return reply(400,{ok:false,error:"invalid_file"});
      path=`${reg.id}/${crypto.randomUUID()}.${type.ext}`;
      const {error}=await db.storage.from(bucket).upload(path,bytes,{contentType:type.type,upsert:false,cacheControl:"60"}); if(error) throw error;
    }
    const {error}=await db.from("peserta_reports").insert({registration_id:reg.id,subject,message,image_path:path});
    if(error) { if(path) await db.storage.from(bucket).remove([path]); throw error; }
    return reply(200,{ok:true});
  } catch(error) { console.error("peserta-kendala error", error instanceof Error ? error.message : "unknown"); return reply(500,{ok:false,error:"server_error"}); }
});
