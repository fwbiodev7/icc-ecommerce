import { NextRequest,NextResponse } from 'next/server';
import Stripe from 'stripe';
import { randomUUID } from 'node:crypto';
import { db } from '../../../lib/database';
import { paymentsReady,validateItems } from '../../../lib/checkout';
export async function POST(req:NextRequest){
 if(!paymentsReady())return NextResponse.json({error:'Pagamento online ainda não habilitado. Continue pelo WhatsApp.'},{status:503});
 if(req.headers.get('origin')!==new URL(process.env.APP_URL!).origin)return NextResponse.json({error:'Origem inválida.'},{status:403});
 if(Number(req.headers.get('content-length')||0)>12000)return NextResponse.json({error:'Pedido muito grande.'},{status:413});
 let body;let items;
 try{const text=await req.text();if(text.length>12000)throw new Error('Pedido muito grande.');body=JSON.parse(text);items=validateItems(body.items);if(typeof body.name!=='string'||body.name.trim().length<3||body.name.length>120||typeof body.email!=='string'||body.email.length>254||!/^\S+@\S+\.\S+$/.test(body.email)||typeof body.phone!=='string'||!/^[0-9+() -]{10,20}$/.test(body.phone)||body.fulfillment!=='Retirada na loja')throw new Error('Confira seus dados. Pagamento online disponível apenas para retirada.');}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Pedido inválido.'},{status:400});}
 const sql=db();const id=randomUUID();const stripe=new Stripe(process.env.STRIPE_SECRET_KEY!);let reserved=false;let createdSession:string|undefined;let sessionAttempted=false;
 try{
  await sql`SELECT reserve_order(${id}::uuid,${body.name.trim()},${body.email},${body.phone},${JSON.stringify(items)}::jsonb)`;reserved=true;
  sessionAttempted=true;const session=await stripe.checkout.sessions.create({mode:'payment',payment_method_types:['card'],customer_email:body.email,client_reference_id:id,metadata:{order_id:id},line_items:items.map(p=>({quantity:p.quantity,price_data:{currency:'brl',unit_amount:p.price,product_data:{name:p.name}}})),success_url:`${process.env.APP_URL}/pedido?session_id={CHECKOUT_SESSION_ID}`,cancel_url:`${process.env.APP_URL}/checkout`,expires_at:Math.floor(Date.now()/1000)+1800},{idempotencyKey:id});
  createdSession=session.id;await sql`UPDATE orders SET stripe_session=${session.id} WHERE id=${id}::uuid`;
  return NextResponse.json({url:session.url});
 }catch(e){const definiteFailure=e instanceof Stripe.errors.StripeInvalidRequestError||e instanceof Stripe.errors.StripeAuthenticationError;const canRelease=!sessionAttempted||Boolean(createdSession)||definiteFailure;if(reserved&&canRelease){try{if(createdSession)await stripe.checkout.sessions.expire(createdSession);await sql`SELECT release_order(${id}::uuid)`;}catch{/* Preserve reservation when provider expiry cannot be confirmed; signed webhook reconciles it. */}}return NextResponse.json({error:'Não foi possível iniciar o pagamento. Consulte a ICC antes de tentar novamente.'},{status:409});}
}
