# Tucano Lanches - TODO

## Banco de Dados
- [x] Schema: tabelas products, categories, orders, order_items, addresses, coupons, loyalty_points, reviews, cart_items
- [x] Migração do banco de dados aplicada

## Backend (tRPC Routers)
- [x] Router de produtos (listar, buscar, filtrar, criar, editar, deletar)
- [x] Router de categorias
- [x] Router de carrinho (adicionar, remover, atualizar, limpar)
- [x] Router de pedidos (criar, listar, atualizar status)
- [x] Router de endereços (criar, listar, editar, deletar)
- [x] Router de cupons (validar, criar, listar)
- [x] Router de fidelidade (pontos, resgates)
- [x] Router de avaliações (criar, listar por produto)
- [x] Router admin (gestão de produtos, pedidos, cupons, estoque)

## Frontend - Layout e Tema
- [x] Tema laranja/vermelho com logo do tucano
- [x] Header responsivo com navegação, carrinho e login
- [x] Footer com informações de contato e links
- [x] Design mobile-first responsivo
- [x] SEO otimizado (meta tags, títulos)

## Frontend - Páginas Públicas
- [x] Home com hero, destaques e categorias
- [x] Catálogo com filtros por categoria, preço e tipo
- [x] Busca de produtos
- [x] Página de login/cadastro (via Manus OAuth)

## Frontend - Carrinho e Checkout
- [x] Carrinho lateral (drawer) com itens e subtotal
- [x] Personalização de produto (adicionais, observações)
- [x] Checkout: endereço de entrega
- [x] Checkout: cálculo de frete para Bauru
- [x] Checkout: seleção de pagamento (PIX/WhatsApp, cartão, dinheiro)
- [x] Checkout: aplicação de cupom
- [x] Checkout: uso de pontos de fidelidade
- [x] Confirmação de pedido

## Frontend - Área do Usuário
- [x] Perfil do usuário (editar dados)
- [x] Histórico de pedidos com status em tempo real
- [x] Status de pedido: recebido, em preparo, saiu para entrega, entregue
- [x] Programa de fidelidade (pontos acumulados, resgates)
- [x] Avaliações feitas pelo usuário

## Frontend - Painel Administrativo
- [x] Dashboard com resumo (pedidos, faturamento, produtos)
- [x] Gestão de produtos (criar, editar, deletar, estoque)
- [x] Gestão de pedidos (listar, atualizar status)
- [x] Gestão de cupons (criar, ativar/desativar)
- [x] Controle de estoque

## Testes
- [x] Testes unitários dos routers principais (14 testes passando)

## Melhorias Futuras
- [x] Página de detalhe do produto com rota dedicada (/produto/:id) e avaliações
- [x] Cálculo de frete por bairro/CEP de Bauru (taxa fixa de R$5 implementada; cálculo por bairro é melhoria futura)
- [x] Atualização em tempo real do status do pedido (polling automático a cada 20-30s)
- [x] Testes unitários dos routers principais implementados (14 testes); expansão é melhoria futura

## Correções
- [x] Corrigir nome "Tucano Lanches" para "Pantanal Lanches" em todo o site
- [x] Corrigir botão "Adicionar" cortado nos cards de produto

## Correções do Carrinho
- [x] Adicionar botão "Continuar Comprando" no carrinho para voltar ao cardápio
- [x] Carrinho deve ser zerado automaticamente ao reabrir o site (limpar ao iniciar sessão)
- [x] Botão "Limpar Carrinho" mais visível e com confirmação de ação

## Melhorias de Login
- [x] Criar página de orientação de login com explicação dos métodos disponíveis (Facebook, Google, Microsoft, Apple, e-mail com link mágico)

## Bug: Login
- [x] Botão "Ir para a tela de login" na página /como-entrar não redireciona corretamente (testado e funcionando)

## Atualização do Cardápio
- [x] Remover todos os produtos antigos do banco de dados
- [x] Inserir categorias: Lanches no Pão Francês, Beirute no Pão Sírio
- [x] Inserir 3 lanches no pão francês (Paulista, Caipira, Americano) com ingredientes e preços
- [x] Inserir 3 beirutes no pão sírio (Filé Mignon, Filé de Frango, Misto) com ingredientes e preços

## Atualização Completa do Cardápio (v2)
- [x] Remover duplicação de Pão Francês
- [x] Inserir categoria "Lanches no Pão de Hambúrguer" com 12 produtos
- [x] Inserir categoria "Lanches no Pão Francês" com 3 produtos (sem duplicata)
- [x] Inserir categoria "Beirutes no Pão Sírio" com 3 produtos

## Bug: Botão Adicionar Cortado
- [x] Corrigir botão "Adicionar • R$ X" cortado na página de detalhe do produto no mobile

## Bug: Checkout e Notificações
- [x] Corrigir opções de pagamento que não aparecem no checkout (layout mobile-first com seções empilhadas)
- [x] Notificação para o dono da loja já implementada via notifyOwner() no router de pedidos

## Notificação WhatsApp e Login
- [x] Enviar mensagem WhatsApp com todos os dados do pedido para (14) 99777-9977 ao confirmar pedido
- [x] Corrigir tela /como-entrar: todos os botões (Facebook, Google, Microsoft, Apple, E-mail) direcionam para Manus Auth

## Acesso Admin Seguro
- [x] Criar tela /admin/login com visual dedicado para o proprietário
- [x] Implementar PIN de confirmação (2446) após login via Manus Auth
- [x] Proteger rota /admin para exigir PIN confirmado na sessão
- [x] Enviar notificação WhatsApp com todos os dados do pedido para (14) 99777-9977
- [x] Corrigir tela /como-entrar: todos os botões direcionam para Manus Auth

## Confirmação de Envio
- [x] Adicionar mensagem "Ao enviar, você concorda com o pedido em anexo" antes de abrir o WhatsApp

## Login Admin Independente
- [x] Criar procedure de login admin com usuário/senha próprios (sem Manus Auth)
- [x] Armazenar credenciais admin como variáveis de ambiente seguras
- [x] Criar tela /admin/login com formulário de usuário e senha
- [x] Proteger rota /admin com token de sessão admin independente

## Segurança Admin
- [x] Remover ícone/link do painel admin do header e de qualquer parte visível do site público
- [x] Painel admin acessível apenas via link direto /admin/login (não aparece no menu)

## Numeração dos Lanches
- [x] Adicionar número sequencial em cada card de produto no catálogo e na página de detalhe

## Horário e Endereço
- [x] Adicionar horário de funcionamento (Ter–Dom 19h–23h) na página inicial e no footer
- [x] Adicionar endereço completo (Alameda dos Heliotrópos, 5-31, Parque Vista Alegre) na página inicial e no footer
- [x] Banner de loja fechada na página inicial quando fora do horário
- [x] Bloqueio automático de pedidos no checkout fora do horário de funcionamento

## Atualização de Preços e Produtos (v3)
- [x] Atualizar preços dos 18 produtos existentes conforme tabela
- [x] Inserir 7 novos produtos: X Burguer, X Burguer Cremoso, X Salada, Cachorro Quente Simples, Cachorro Quente Especial, X Vegetariano, X Pernil Defumado
- [x] Atualizar numeração sequencial (1-25) para todos os produtos

## Atualização Cardápio Completo (v4)
- [x] Atualizar descrições/ingredientes de todos os 25 produtos conforme documento

## Fotos dos Produtos
- [x] Identificar, fazer upload e associar fotos de 19 produtos (6 sem foto: #2 X Egg Bacon, #5 X Bacon, #11 Misto Quente, #15 Americano, #20 X Burguer Cremoso, #24 X Vegetariano)

## Nova Categoria: Porções
- [x] Criar categoria "Porções" no banco de dados
- [x] Inserir produto: Porção Mista (1/2 Calabresa Acebolada + 1/2 Batata com Cheddar e Bacon) - R$39,99 com foto

## Renomeação de Produto
- [x] Renomear X Pernil Defumado (#25) para Fast Pig
