import { NextRequest,NextResponse } from 'next/server';
import {adminReady,adminCookie,newSession,same,validOrigin} from '../../../../lib/admin';
import {db} from '../../../../lib/database';
import {createHash} from 'node:crypto';
export async function POST(req:NextRequest){
 if(!adminReady())return NextResponse.json({error:'Configure o banco e as credenciais administrativas para ativar esta área.'},{status:503});
 if(!validOrigin(req))return NextResponse.json({error:'Origem inválida.'},{status:403});
 let password;try{const text=await req.text();if(text.length>1000)throw new Error();password=JSON.parse(text).password;if(typeof password!=='string')throw new Error();}catch{return NextResponse.json({error:'Dados inválidos.'},{status:400});}
 const sql=db();const ip=createHash('sha256').update((req.headers.get('x-forwarded-for')||'unknown')+process.env.ADMIN_SESSION_SECRET).digest('hex');
 try{const tries=await sql`INSERT INTO admin_attempts(key,attempts,window_start) VALUES (${ip},1,NOW()) ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN admin_attempts.window_start < NOW()-INTERVAL '15 minutes' THEN 1 ELSE admin_attempts.attempts+1 END, window_start=CASE WHEN admin_attempts.window_start < NOW()-INTERVAL '15 minutes' THEN NOW() ELSE admin_attempts.window_start END RETURNING attempts`;if(Number(tries[0].attempts)>5)return NextResponse.json({error:'Muitas tentativas. Aguarde 15 minutos.'},{status:429});if(!same(password,process.env.ADMIN_PASSWORD!))return NextResponse.json({error:'Senha incorreta.'},{status:401});const response=NextResponse.json({ok:true});response.cookies.set(adminCookie,newSession(),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',maxAge:8*60*60,path:'/'});return response;}catch{return NextResponse.json({error:'Não foi possível acessar a administração.'},{status:503});}
}
export async function DELETE(req:NextRequest){if(!validOrigin(req))return NextResponse.json({error:'Origem inválida.'},{status:403});const res=NextResponse.json({ok:true});res.cookies.delete(adminCookie);return res;}
