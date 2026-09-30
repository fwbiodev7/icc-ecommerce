import { NextRequest,NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '../../../lib/database';
export async function POST(req:NextRequest){
 if(!process.env.STRIPE_SECRET_KEY||!process.env.STRIPE_WEBHOOK_SECRET||!process.env.DATABASE_URL)return NextResponse.json({error:'Not configured'},{status:503});
 const stripe=new Stripe(process.env.STRIPE_SECRET_KEY);let event:Stripe.Event;
 try{event=stripe.webhooks.constructEvent(await req.text(),req.headers.get('stripe-signature')||'',process.env.STRIPE_WEBHOOK_SECRET);}catch{return NextResponse.json({error:'Invalid signature'},{status:400});}
 const sql=db();
 try{if(['checkout.session.completed','checkout.session.async_payment_succeeded','checkout.session.expired','checkout.session.async_payment_failed'].includes(event.type)){const session=event.data.object as Stripe.Checkout.Session;const id=session.metadata?.order_id;if(!id||!(/^[a-f0-9-]{36}$/i.test(id)))return NextResponse.json({received:true});if((event.type==='checkout.session.completed'||event.type==='checkout.session.async_payment_succeeded')&&session.payment_status==='paid'){const rows=await sql`UPDATE orders SET status='paid', stripe_session=${session.id}, paid_at=NOW() WHERE id=${id}::uuid AND status IN ('pending','paid') AND total=${session.amount_total} AND ${session.currency}='brl' RETURNING id`;if(!rows.length)throw new Error('Order mismatch');}else if(event.type==='checkout.session.expired'||event.type==='checkout.session.async_payment_failed')await sql`SELECT release_order(${id}::uuid)`;}return NextResponse.json({received:true});}catch{return NextResponse.json({error:'Retry required'},{status:500});}
}
