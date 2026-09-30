import { createHmac,timingSafeEqual } from 'node:crypto';
import { NextRequest } from 'next/server';
const cookie='icc-admin';
export { cookie as adminCookie };
export function adminReady(){return Boolean(process.env.DATABASE_URL&&process.env.ADMIN_PASSWORD&&process.env.ADMIN_PASSWORD.length>=16&&process.env.ADMIN_SESSION_SECRET&&process.env.ADMIN_SESSION_SECRET.length>=32);}
export function same(a:string,b:string){const x=Buffer.from(a);const y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y);}
function sign(value:string){return createHmac('sha256',process.env.ADMIN_SESSION_SECRET!).update(value).digest('hex');}
export function newSession(){const expiry=String(Date.now()+8*60*60*1000);return `${expiry}.${sign(expiry)}`;}
export function authorized(req:NextRequest){if(!adminReady())return false;const token=req.cookies.get(cookie)?.value||'';const [expiry,signature]=token.split('.');return /^\d+$/.test(expiry||'')&&Number(expiry)>Date.now()&&same(signature||'',sign(expiry));}
export function validOrigin(req:NextRequest){return req.headers.get('origin')===new URL(process.env.APP_URL||'http://localhost:3000').origin;}
