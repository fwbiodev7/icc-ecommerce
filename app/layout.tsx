import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'ICC | Tecnologia & Papelaria em Varginha', description: 'Encontre tecnologia, informática e papelaria na ICC. Av. Rui Barbosa, 76, Centro, Varginha. Atendimento pelo WhatsApp.', icons: {icon:'/favicon.svg'} };
export default function Layout({ children }: {children: React.ReactNode}) { return <html lang="pt-BR"><body>{children}</body></html>; }
