# Finanças — Global Financial OS

Dashboard de finanças pessoais com lançamento de transações por linguagem natural. Você escreve "almoço 47 reais no crédito" e a IA estrutura o lançamento: descrição, valor, tipo e categoria.

**App no ar:** https://finan-as-global.vercel.app

---

## O lançamento por linguagem natural

A parte mais interessante do projeto. Em vez de preencher cinco campos para registrar um gasto, o usuário escreve uma frase.

O texto vai para o **Gemini** com `responseSchema`, que obriga o modelo a devolver JSON no formato esperado:

```ts
responseSchema: {
  type: Type.OBJECT,
  properties: {
    description: { type: Type.STRING },
    amount:      { type: Type.NUMBER },
    type:        { type: Type.STRING },   // income | expense
    category:    { type: Type.STRING }
  },
  required: ["description", "amount", "type", "category"]
}
```

O retorno preenche o formulário já aberto, com a data do dia. O usuário confere e confirma. A saída estruturada evita o problema clássico de pedir JSON no prompt e receber texto solto, que quebraria o parse.

Código: [`components/TransactionsView.tsx`](finanças---global-financial-os%20(1)/components/TransactionsView.tsx)

---

## Funcionalidades

| Tela | O que faz |
|---|---|
| **Dashboard** | Saldo total, receita e despesa do mês, total investido e progresso médio das metas, com gráficos |
| **Transações** | Lançamento por IA ou manual, com método de pagamento, categoria e cartão vinculado |
| **Investimentos** | Carteira com renda fixa, ações, FIIs e cripto; valor aplicado contra valor atual |
| **Métricas** | Evolução e composição dos gastos e da carteira ao longo do tempo |
| **Metas** | Objetivos de poupança com prazo, progresso e compartilhamento por e-mail |
| **Arquitetura** | O schema SQL e a modelagem do sistema, dentro do próprio app |
| **Configurações** | Perfil e cadastro de cartões (nome, bandeira, últimos quatro dígitos, cor) |

Autenticação, dados e compartilhamento rodam no Supabase.

---

## Stack

- **React 19** + **TypeScript** + **Vite**
- **Supabase** — autenticação e banco PostgreSQL
- **Google Gemini** (`@google/genai`) — extração estruturada das transações
- **Recharts** — gráficos
- **lucide-react** — ícones
- **Vercel** — deploy

---

## Modelo de dados

Cinco tabelas no PostgreSQL:

- `transactions` — tipo, valor, categoria, método de pagamento, conta, data
- `investments` — ativo, classe, valor aplicado, valor atual, data da compra
- `savings_goals` — meta, valor alvo, valor guardado, prazo
- `goal_shares` — compartilhamento de uma meta com outro e-mail
- `payment_cards` — cartões do usuário

O schema completo está na tela de Arquitetura e em [`components/ArchitectureView.tsx`](finanças---global-financial-os%20(1)/components/ArchitectureView.tsx).

---

## Rodando localmente

Requer Node.js.

```bash
npm install
cp .env.example .env.local   # preencha GEMINI_API_KEY
npm run dev
```

As credenciais do Supabase ficam em `supabase.ts`. A chave usada no cliente é a publishable (`sb_publishable_…`), feita para ser pública — o controle de acesso aos dados fica nas policies de Row Level Security do próprio Supabase.

---

Feito por **Joyce Gomes de Queiroz** — [LinkedIn](https://linkedin.com/in/--joycequeiroz) · [GitHub](https://github.com/joyce-iroz)
