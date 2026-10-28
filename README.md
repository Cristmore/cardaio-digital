# Cardápio Digital & Delivery - Restaurante Teste 🍱

Aplicação Web moderna, responsiva e mobile-first para restaurantes e deliverys.

## 🚀 Como rodar o projeto

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Gerar build de produção (pasta dist/)
npm run build
```

## 🛠️ Recursos

- **Cardápio Mobile-First**: Light design com paleta quente (Laranja/Amarelo), busca em tempo real e categorias.
- **Modal de Opcionais com Limites**: Divisão entre **Carnes** e **Gerais**, com limites configurados pelo admin.
- **Identificação de Cliente por Celular**: Preenchimento automático do endereço para clientes cadastrados, com confirmação e atualização instantânea.
- **Envio Automático via WhatsApp (`wa.me`)**: Mensagem formatada com todos os detalhes do pedido, endereço, itens, valores e chave PIX.
- **Impressão Térmica**: Formatação padrão para impressoras térmicas (80mm e 58mm).
- **Painel do Administrador**:
  - Acesso por senha (padrão: `admin123`).
  - Dashboard de pedidos em tempo real com controle de status.
  - Cadastro e edição de produtos, imagens, categorias e limites de opcionais.
  - Configuração de WhatsApp do restaurante, Chave PIX, Taxa de entrega e Tempo estimado.
- **Banco de Dados Supabase**: Schema SQL pronto em `supabase_schema.sql` com fallback offline.
