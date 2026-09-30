import { products } from './catalog';
export function validateItems(raw:unknown){
 if(!Array.isArray(raw)||raw.length===0||raw.length>20)throw new Error('Sua sacola deve conter de 1 a 20 produtos.');
 const seen=new Set<string>();
 return raw.map(item=>{if(!item||typeof item.id!=='string'||!Number.isInteger(item.quantity)||item.quantity<1||item.quantity>10||seen.has(item.id))throw new Error('Quantidade ou produto inválido.');seen.add(item.id);const p=products.find(p=>p.id===item.id);if(!p)throw new Error('Produto não encontrado.');return {id:p.id,name:p.name,quantity:item.quantity,price:p.price};});
}
export function paymentsReady(){return process.env.CATALOG_APPROVED==='true'&&Boolean(process.env.APP_URL&&process.env.STRIPE_SECRET_KEY&&process.env.STRIPE_WEBHOOK_SECRET&&process.env.DATABASE_URL);}
