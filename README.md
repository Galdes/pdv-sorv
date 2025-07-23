# 🍦 Sorveteria Conteiner - Sistema PDV Digital

Sistema completo de Point of Sale (PDV) digital desenvolvido especificamente para sorveterias, com menu digital, gestão administrativa e sistema de pedidos em tempo real.

## 🚀 Funcionalidades

### 📱 Menu Digital
- **Menu especializado** para sorveteria
- **Seleção de sabores** pelo cliente
- **Interface responsiva** e moderna
- **QR codes** para acesso rápido por mesa

### 🛠️ Painel Administrativo
- **Gestão de produtos** e sabores
- **Controle de categorias** e preços
- **Sistema de usuários** hierárquico
- **Visualização de pedidos** em tempo real
- **Interface para cozinha**

### 🎯 Sistema de Pedidos
- **Criação automática** de comandas
- **Múltiplos sabores** por produto
- **Status de pedidos** (pendente, preparando, pronto)
- **Observações** personalizadas

## 🛠️ Tecnologias

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Supabase** (PostgreSQL)
- **React QR Code**

## 📦 Instalação

```bash
# Clone o repositório
git clone [URL_DO_REPOSITORIO]

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local

# Execute o projeto
npm run dev
```

## 🔧 Configuração

### Variáveis de Ambiente

Crie um arquivo `.env.local` com:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
```

### Banco de Dados

Execute os scripts SQL na ordem:

1. `doc/corrigir_estrutura_tabelas.sql`
2. `doc/corrigir_rls_categorias.sql`
3. `doc/corrigir_rls_sabores.sql`
4. `doc/adicionar_sabores_multiplos.sql`
5. `doc/adicionar_limite_sabores.sql`
6. `doc/atualizar_funcoes_com_max_sabores.sql`
7. `doc/atualizar_limites_sabores_produtos.sql`
8. `doc/produtos_final_sorveteria.sql`
9. `doc/acompanhamentos_acai.sql`
10. `doc/atualizar_nome_sorveteria.sql`

## 👥 Tipos de Usuário

- **sistema_admin**: Administrador geral do sistema
- **dono_bar**: Dono da sorveteria
- **garcom**: Atendente
- **cozinheiro**: Funcionário da cozinha

## 📊 Estrutura do Projeto

```
├── app/                    # Páginas Next.js
│   ├── admin/             # Painel administrativo
│   ├── menu-sorveteria/   # Menu digital
│   └── layout.tsx         # Layout principal
├── components/            # Componentes reutilizáveis
├── lib/                   # Utilitários e configurações
├── hooks/                 # Custom hooks
├── doc/                   # Scripts SQL
└── public/               # Arquivos estáticos
```

## 🎨 Interface

- **Tema dark/light** automático
- **Design responsivo** para mobile e desktop
- **Componentes reutilizáveis** para consistência
- **UX otimizada** para sorveteria

## 📈 Status do Projeto

✅ **PRIMEIRA FASE CONCLUÍDA**
- Sistema básico 100% funcional
- 100+ produtos cadastrados
- 50+ sabores disponíveis
- Interface administrativa completa
- Menu digital implementado

## 🚀 Deploy

O projeto está configurado para deploy no Vercel:

```bash
npm run build
```

## 📝 Licença

Este projeto foi desenvolvido para a Sorveteria Conteiner.

---

**🍦 Sistema pronto para produção!** ✨
