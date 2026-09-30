# ICC • Tecnologia & Papelaria

Loja em português para a ICC Shopping da Informática, Varginha/MG. Next.js App Router, React, TypeScript, CSS responsivo, Lucide, Stripe Checkout e PostgreSQL/Neon. Preparada para importar na Vercel.

## O que está funcionando

- Home com identidade verde, vitrines Tech e Papelaria, animações e respeito à preferência de movimento reduzido.
- Páginas de categorias, filtros, busca, ordenação, detalhes de produtos e favoritos.
- Sacola persistente neste navegador, alteração de quantidade e checkout com validação.
- Envio de solicitação de pedido ao WhatsApp **+55 35 9179-1821**, conforme confirmação do solicitante. O número de oito dígitos foi mantido intencionalmente; confirme o funcionamento na conta da loja antes de divulgar.
- Endereço, telefone, Instagram e comentários fornecidos nas capturas. A nota 4,6/172 avaliações é atribuída à captura, não anunciada como consulta atual.
- Integração de pagamento com preço validado no servidor, reserva transacional de estoque, confirmação por webhook assinado e cancelamento idempotente.
- Administração em `/admin`, com login protegido, sessão HttpOnly, limite de tentativas no banco, estoque e acompanhamento dos últimos 100 pedidos online.

## Situação comercial

Os sete produtos Tech e preços vieram da imagem de catálogo enviada em 30/09/2026. As fotos exibidas foram pesquisadas na web e otimizadas em WebP, substituindo os recortes de baixa resolução. A fonte e a ressalva sobre variantes aparecem nos detalhes de cada produto. Dois títulos truncados e especificações incompletas são identificados para confirmação. Estoque real não foi fornecido.

Os quatro itens de papelaria são **demonstrações**, com preços e fotos ilustrativos identificados. Não representam catálogo aprovado. Pagamentos estão desativados por padrão. O checkout de WhatsApp gera uma solicitação a ser confirmada pela loja, não registra um pedido pago.

Não há conta de cliente, emissão fiscal, rastreamento por transportadora ou integração automática de frete. Gestão do conteúdo dos produtos é feita em `lib/catalog.ts`; estoque e pedidos pagos no painel `/admin` conectado ao PostgreSQL. Não apresentar esta versão como operação comercial 100% pronta antes de configurar e validar as dependências abaixo.

## Executar

```bash
npm ci
cp .env.example .env.local
npm run dev
```

No PowerShell use `Copy-Item .env.example .env.local`. Abra http://localhost:3000.

## Publicar na Vercel

1. Importe o repositório público `fwbiodev7/icc-ecommerce` na sua conta Vercel.
2. Mantenha o preset Next.js, build `npm run build` e instalação `npm ci`.
3. Configure `NEXT_PUBLIC_WHATSAPP=553591791821`. Mantenha `CATALOG_APPROVED=false` para atendimento pelo WhatsApp.
4. Faça deploy. Configure domínio e `APP_URL` com a origem HTTPS definitiva.

Sem as chaves de pagamento o site funciona como catálogo com sacola e solicitação via WhatsApp. Nenhum segredo vai para o GitHub. `.env.local` é ignorado pelo Git.

## Ativar pagamentos e estoque

1. Abra uma conta Stripe adequada à empresa e crie um PostgreSQL no Neon. Configure as chaves em modo de teste primeiro.
2. Execute `database/schema.sql`. Produtos começam com estoque zero e inativos. Atualize estoque real, preços e `active=true` apenas após confirmar os produtos. Os preços do banco precisam coincidir com `lib/catalog.ts`.
3. Configure `DATABASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` e `APP_URL` na Vercel. O banco não deve ser acessível diretamente pelo cliente.
4. Cadastre webhook HTTPS `/api/webhook` com `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.expired` e `checkout.session.async_payment_failed`.
5. Substitua/remova os produtos de demonstração, confirme modelos, preços, fotos e informações comerciais. Publique os dados legais, políticas de privacidade, devolução, garantia, canais e prazos aprovados pela loja.
6. Defina `CATALOG_APPROVED=true` somente após essas etapas. O pagamento com cartão será exibido. Pagamento online suporta retirada na loja; entrega continua sujeita à consulta pelo WhatsApp.
7. Teste compra aprovada/recusada, webhook repetido, sessão expirada, falta de estoque e duas compras concorrentes antes de trocar para chaves de produção.

`reserve_order` bloqueia as linhas de estoque em ordem consistente e reserva todos os itens numa transação. `release_order` restaura estoque uma única vez. A página de sucesso não confirma pagamento por conta própria: consulta o estado gravado pelo webhook. Se o banco/provedor falhar, o endpoint retorna erro sem expor detalhes internos. Falhas ambíguas de criação de sessão exigem conciliação no Stripe antes de liberar manualmente reservas pendentes. Configure também limites de requisição no provedor de hospedagem antes de vender publicamente.

Pedidos pagos podem ser acompanhados em `/admin`, com estados novo, em preparação, pronto para retirada e retirado. Configure `ADMIN_PASSWORD` com pelo menos 16 caracteres e `ADMIN_SESSION_SECRET` aleatório com pelo menos 32 caracteres. A sessão expira em 8 horas. Há limite de 5 tentativas de acesso por janela de 15 minutos; o proxy precisa fornecer corretamente o IP de origem. Não existe automação de expedição nem reembolso pelo painel; reembolsos são tratados no Stripe e o estoque deve ser reconciliado pela equipe. Pedidos WhatsApp são acompanhados no próprio WhatsApp. Revise controles de acesso, retenção e cópias de segurança com o responsável da loja.

## Verificação

```bash
npm run build
npm test
npm audit
```

Os testes iniciam o build de produção na porta 3100 e usam Microsoft Edge em modo headless. Para Chromium instalado via Playwright: `npx playwright install chromium` e `BROWSER_CHANNEL=chromium npm test` em um shell compatível, ou `$env:BROWSER_CHANNEL='chromium'; npm test` no PowerShell. `TEST_URL` permite testar um servidor já em execução. As capturas de desktop/mobile ficam em `test-results/` (ignorado pelo Git).

Integrações Stripe/Neon e o painel conectado não são testados de ponta a ponta sem credenciais. Os testes locais verificam fluxos de catálogo, filtros, favoritos, persistência da sacola, quantidades, mensagem WhatsApp, fotos, ausência de overflow em 1440/390/320px, rotas, bloqueio de cobrança e acesso administrativo sem autenticação.

## Fontes dos ativos

- Fotos dos produtos Tech: catálogo enviado pelo solicitante. Uso público autorizado pelo pedido de criação do repositório; a loja deve confirmar direitos de publicação.
- Fotos atuais da vitrine Tech: [Rapoo H120](https://rapoo.africa/product/h120/), [Razer Kraken X](https://www.panacompu.com/panama/en/product-information/razer-kraken-x-for-playstation-headset-wired-over-ear-headband-white), [Redragon Nireus](https://www.pichau.com.br/headset-gamer-redragon-nireus-rgb-som-surround-7-1-drivers-50mm-branco-h399w-rgb), [PCYes KLR](https://www.chipbyte.com.br/usb/teclado-mecanico-usb-pcyes-krl-vermelho-switch-outemu-blue/1752), [Evolut Shodan](https://www.ciapc.com.br/perifericos/mouse-teclado/teclado-mecanico-gamer-evolut-shodan-rgb-switch-red-preto-eg-203rg), [T-Dagger Bora](https://www.t-dagger.com/products/t-dagger-bora-t-tgk315-gaming-mechanical-keyboard-rgb-backlighting) e [Logitech MK235](https://www.logitech.com/pt-br/shop/p/mk235-durable-keyboard-mouse.920-007903). Mapeamento em `public/images/sources.json`. Razer/Evolut/T-Dagger são referências da linha, pois os nomes estão cortados na captura; não foi presumida a variante exata. As fotos não autorizam copiar preços, garantias ou ofertas de terceiros.
- Movimento: aparição por IntersectionObserver, entrada do destaque e da sacola, feedback nos favoritos e na quantidade, zoom suave nas fotos e transições de botões. Cards preservam a mesma instância ao alterar a sacola. Todos os efeitos respeitam `prefers-reduced-motion`.
- Headphone editorial: [Unsplash](https://unsplash.com/s/photos/headphones), foto `photo-1585298723682-7115561c51b7`.
- Papelaria ilustrativa: [Kelly Sikkema](https://unsplash.com/photos/notebook-and-writing-supplies-on-wooden-surface-cGGCg7quYn0), [workspace](https://unsplash.com/photos/workspace-with-notepad-pen-and-accessories-tUydj6Rx7tg), [lápis](https://unsplash.com/photos/a-row-of-colored-pencils-lined-up-against-a-white-background-47JLCB-ZL_0), [caderno](https://unsplash.com/photos/black-spiral-notebook-with-pencils-edWz3EYB3qQ).
- Fontes DM Sans e Manrope via Google Fonts; o CSS inclui fallback local.

O checkout hospedado segue o fluxo oficial da [Stripe](https://docs.stripe.com/payments/checkout/quickstarts); o projeto segue o [Next.js App Router](https://nextjs.org/docs/app/getting-started).
