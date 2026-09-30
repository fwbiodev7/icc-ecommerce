import { notFound } from 'next/navigation';
import Store from '../../components/store';
import { products } from '../../lib/catalog';
export default async function Page({params}:{params:Promise<{slug?:string[]}>}) { const {slug=[]}=await params; const route=slug.join('/'); if (!['','tech','papelaria','favoritos','checkout','pedido','sobre','privacidade','trocas'].includes(route) && !(slug.length===2 && slug[0]==='produto' && products.some(p=>p.id===slug[1]))) notFound(); return <Store route={route} online={process.env.CATALOG_APPROVED==='true' && Boolean(process.env.STRIPE_SECRET_KEY && process.env.DATABASE_URL && process.env.STRIPE_WEBHOOK_SECRET && process.env.APP_URL)} />; }
