import { NextRequest, NextResponse } from "next/server";
import { marizBackendConfigured,marizServerClient } from "../../../../../../lib/mariz/supabase-server";

export const dynamic="force-dynamic";
export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}) {
 if(!marizBackendConfigured())return NextResponse.json({error:"Not configured"},{status:503});
 const {id}=await params;
 if(!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(id))return NextResponse.json({error:"Invalid document ID"},{status:400});
 const sb=await marizServerClient();
 const {data:{user},error:authError}=await sb.auth.getUser();
 if(authError||!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 // RPC enforces reviewer role and conflict-of-interest separation, and writes an audit event.
 const {data:path,error}=await sb.rpc("mariz_authorize_document_view",{p_document:id});
 if(error||typeof path!=="string")return NextResponse.json({error:"Not permitted"},{status:403});
 const {data:signed,error:linkError}=await sb.storage.from("mariz-kyb-private").createSignedUrl(path,45);
 if(linkError||!signed?.signedUrl)return NextResponse.json({error:"Unable to open document"},{status:500});
 return NextResponse.redirect(signed.signedUrl,{headers:{"Cache-Control":"no-store, private","Referrer-Policy":"no-referrer"}});
}
