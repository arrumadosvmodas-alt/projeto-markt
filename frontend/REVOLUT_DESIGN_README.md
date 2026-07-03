# 🎨 Markt Familiar — Revolut-Style Design

Interface moderna, minimalista e responsiva para organização familiar.

> Inspirado no design limpo e elegante do Revolut, combinado com funcionalidades específicas para famílias compartilharem compras, calendário, tarefas e comunicação.

---

## 🌟 Destaques

✨ **Design Minimalista**  
Sem distrações, foco no essencial.

🎯 **Revolut-Inspired**  
Cores primárias (indigo/purple), gradientes, animações suaves.

📱 **Mobile-First**  
Responsivo desde o design. Bottom navigation. Touch-friendly.

🌙 **Dark Mode**  
Suporta preferências do sistema automaticamente.

⚡ **Performático**  
CSS puro, sem frameworks pesados. React sem excesso de deps.

🎬 **Animações**  
Transições suaves (150-300ms). Feedback visual claro.

---

## 📦 Estrutura

```
frontend/
├── src/
│   ├── styles/
│   │   └── design-system.css              ← Sistema de design global
│   ├── components/
│   │   └── UI/
│   │       ├── Button.tsx                 ← Componente botão
│   │       ├── Card.tsx                   ← Componente card
│   │       ├── Input.tsx                  ← Componente input
│   │       ├── Badge.tsx                  ← Componente badge
│   │       └── index.ts
│   └── pages/
│       ├── CircleDashboard.tsx            ← Home
│       ├── CreateCircle.tsx               ← Criar círculo
│       ├── SharedLists.tsx                ← Listas compartilhadas
│       └── Calendar.tsx                   ← Calendário
└── DESIGN_SYSTEM.md                       ← Documentação
```

---

## 🎨 Paleta de Cores

### Cores Primárias
```
Indigo:     #6366f1
Purple:     #a855f7
```

### Cores de Ação
```
✅ Sucesso:  #10b981 (Verde)
⚠️ Aviso:    #f59e0b (Âmbar)
❌ Erro:     #ef4444 (Vermelho)
```

### Neutros
```
Branco:      #ffffff
Cinza Claro: #f9fafb
Cinza:       #e2e8f0
Cinza Escuro: #64748b
Preto:       #0f172a
```

---

## 🧩 Componentes

### Button

```tsx
// Variantes
<Button variant="primary">Primária</Button>
<Button variant="secondary">Secundária</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="danger">Perigo</Button>

// Tamanhos
<Button size="sm">Pequeno</Button>
<Button size="md">Médio</Button>
<Button size="lg">Grande</Button>

// Estados
<Button disabled>Desabilitado</Button>
<Button loading>Carregando...</Button>
<Button fullWidth>Tela cheia</Button>
```

**Visuais:**
```
┌─ PRIMARY ─┐       ┌─ SECONDARY ─┐       ┌─ GHOST ─┐       ┌─ DANGER ─┐
│ Botão 🎯  │       │ Botão       │       │ Botão   │       │ Botão ❌  │
└───────────┘       └─────────────┘       └─────────┘       └──────────┘
Gradiente           Fundo Cinzento       Sem fundo       Fundo vermelho
Sombra              Borda fina           Texto colorido  Texto branco
```

---

### Card

```tsx
// Normal
<Card>Conteúdo aqui</Card>

// Gradient (destaque)
<Card gradient>Conteúdo destacado</Card>

// Compacto
<Card compact>Conteúdo pequeno</Card>
```

**Visual:**
```
┌─────────────────────────────┐
│  Título do Card             │
│                             │
│  Lorem ipsum dolor sit amet │
│  consectetur adipiscing elit│
│                             │
└─────────────────────────────┘
Borda sutil | Sombra leve | Hover aumenta sombra
```

---

### Input

```tsx
<Input
  label="Nome"
  placeholder="Digite seu nome..."
  icon="👤"
  error="Campo obrigatório"
/>
```

**Visual:**
```
Nome
┌─────────────────────────────┐
│ 👤 Digite seu nome...       │
└─────────────────────────────┘
Campo obrigatório              ← erro (vermelho)
```

---

### Badge

```tsx
<Badge variant="primary">👑 Premium</Badge>
<Badge variant="success">✓ Ativo</Badge>
<Badge variant="warning">⚠️ Aviso</Badge>
<Badge variant="danger">❌ Erro</Badge>
```

**Visual:**
```
┌─ primary ─┐  ┌─ success ─┐  ┌─ warning ─┐  ┌─ danger ──┐
│ 👑 Premium │  │ ✓ Ativo   │  │ ⚠️ Aviso   │  │ ❌ Erro    │
└───────────┘  └───────────┘  └───────────┘  └───────────┘
```

---

## 📱 Páginas Implementadas

### 1. CircleDashboard (Home)

**Layout:**
```
┌────────────────────────────────────────┐
│ 🎨 HEADER (Gradiente Indigo-Purple)  │
│ ┌─ Markt ────────────────────── ⚙️ ┐ │
│ ├─────────────────────────────────┤ │
│ │ 👨‍👩‍👧‍👦 Minha Família    ▼ Selecionar │ │
│ └─────────────────────────────────┘ │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ QUICK STATS (Grid 2x2)                 │
│ ┌─────────────┐  ┌─────────────┐      │
│ │ 🛒 Listas   │  │ 💰 Gasto    │      │
│ │      3      │  │ R$ 287,50   │      │
│ └─────────────┘  └─────────────┘      │
│ ┌─────────────┐  ┌─────────────┐      │
│ │ 👥 Membros  │  │ ✓ Tarefas   │      │
│ │      4      │  │      7      │      │
│ └─────────────┘  └─────────────┘      │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ LISTAS COMPARTILHADAS                  │
│ ┌──────────────────────────────┐      │
│ │ 🛒 Compras do Mês            │      │
│ │ ████████░░░░ 5/12 | Há 20min │      │
│ └──────────────────────────────┘      │
│ ┌──────────────────────────────┐      │
│ │ 🛒 Supermercado              │      │
│ │ ███░░░░░░░░░░ 3/8 | Há 1 hora│      │
│ └──────────────────────────────┘      │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ ATIVIDADE DA FAMÍLIA                   │
│ ┌──────────────────────────────┐      │
│ │ 👩 Maria adicionou 3 itens  │      │
│ │ Há 20 min                    │      │
│ └──────────────────────────────┘      │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ 🏠 │ 📅 │ ✓ │ 💬 │ 👥 │  BOTTOM NAV   │
└────────────────────────────────────────┘
```

---

### 2. CreateCircle (Novo Círculo)

**Step 1: Informações Básicas**
```
┌────────────────────────────────────────┐
│ ← Novo Círculo                         │
├────────────────────────────────────────┤
│ ████░░░░░░░░░░  Progresso (Step 1/2)   │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ Informações Básicas                    │
│                                        │
│ Nome do Círculo                        │
│ ┌────────────────────────────────────┐ │
│ │ 📝 Ex: Minha Família...            │ │
│ └────────────────────────────────────┘ │
│                                        │
│ Descrição (opcional)                   │
│ ┌────────────────────────────────────┐ │
│ │ Descreva o propósito deste círculo │ │
│ └────────────────────────────────────┘ │
│                                        │
│ Escolha um ícone                       │
│ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐        │
│ │👨‍👩‍👧‍👦│ │👥 │ │🏠 │ │🎓 │ │🎉 │  ...  │
│ └───┘ └───┘ └───┘ └───┘ └───┘        │
│                                        │
└────────────────────────────────────────┘

┌─ Voltar ────┬──── Próximo ──────┐
│  Secundário │   Primário Gradiente │
└─────────────┴────────────────────┘
```

**Step 2: Convidar Membros**
```
┌────────────────────────────────────────┐
│ ← Novo Círculo                         │
├────────────────────────────────────────┤
│ ████████████░░░░  Progresso (Step 2/2) │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ Convidar Membros                       │
│ Adicione emails das pessoas...         │
│                                        │
│ Email 1:                               │
│ ┌────────────────────────────────────┐ │
│ │ 📧 maria@email.com       | ✕ Remover│ │
│ └────────────────────────────────────┘ │
│                                        │
│ Email 2:                               │
│ ┌────────────────────────────────────┐ │
│ │ 📧 joao@email.com                  │ │
│ └────────────────────────────────────┘ │
│                                        │
│ ┌─ + Adicionar Outro Membro ────────┐ │
│                                        │
│ ℹ️ Não tem email?                      │
│ Você pode convidar membros depois...   │
└────────────────────────────────────────┘

┌─ Voltar ────┬──── Criar Círculo ──┐
│  Secundário │   Primário Gradiente  │
└─────────────┴──────────────────────┘
```

---

### 3. SharedLists (Listas Compartilhadas)

```
┌────────────────────────────────────────┐
│ Listas Compartilhadas                  │
│ ┌─ Supermercado ─┐ ┌─ Farmácia ─┐   │
│ Abas selecionáveis (mobile-friendly)  │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ 🎨 CARD GRADIENT (Indigo-Purple)      │
│ 🛒 Supermercado          ┌────────────┐│
│ Compras do mês de julho  │ Progresso: ││
│                          │ 5/12 items ││
│ ████████░░░░ Progresso  │ ┌────────────┐│
│                          │ 👩 👨 👧 ➕ ││
│ Membros                  │ (avatares)  ││
│ 👩 👨 👧 ➕              │ Convidar    ││
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ 🌾 SECOS                               │
│ ┌─ Arroz integral ─────────┐          │
│ │ ☑️ 2 kg | por Maria | Hoje│          │
│ └─────────────────────────┘          │
│ ┌─ Feijão preto ───────────┐          │
│ │ ☑️ 1 kg | por Maria | Hoje│          │
│ └─────────────────────────┘          │
│                                        │
│ 🥛 LÁCTEOS                             │
│ ┌─ Leite integral ─────────┐          │
│ │ ☐ 3 l  | por Sofia | Hoje│          │
│ └─────────────────────────┘          │
│ ┌─ Pão integral ───────────┐          │
│ │ ☐ 2 un | por João | Hoje │          │
│ └─────────────────────────┘          │
│                                        │
└────────────────────────────────────────┘

         ┌─────────────┐
         │  ➕ Botão   │  (Floating Action Button)
         │  Flutuante  │
         └─────────────┘
```

---

### 4. Calendar (Calendário)

```
┌────────────────────────────────────────┐
│ Calendário        [Mês] [Semana] [Dia]│
│ ➕ Novo evento                         │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ ← Julho 2024 →                         │
├────────────────────────────────────────┤
│ Dom Seg Ter Qua Qui Sex Sab            │
│  1   2   3   4   5   6   7             │
│  8   9  10  11  12  13  14             │
│ 15  16  17  18  19  20  21             │
│ 22  23  24  25  26  27  28             │
│ 29  30  31                             │
│                                        │
│ Legenda: ● = evento                    │
└────────────────────────────────────────┘

EVENTOS SELECIONADOS:
┌────────────────────────────────────────┐
│ Reunião de Família                     │
│ 🕐 19:00 | 📍 Casa                     │
│ Planejamento do mês                    │
│                                        │
│ 👩✓ 👨✓ 👧?                            │
│ (participants com status)              │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ Aniversário da Sofia                   │
│ 🕐 15:00 | 📍 Parque                   │
│ Festa surpresa                         │
│                                        │
│ 👩✓ 👨✓                                │
└────────────────────────────────────────┘
```

---

## 🚀 Como Usar

### 1. Instalação

```bash
# O design system é CSS puro + React
# Sem dependências adicionais!

cd frontend
npm install  # Instala deps já existentes
```

### 2. Importar Design System

```tsx
// src/main.tsx
import './styles/design-system.css'

// Ou em qualquer página
import '../styles/design-system.css'
```

### 3. Usar Componentes

```tsx
import { Button, Card, Input, Badge } from '../components/UI'

export function MyPage() {
  return (
    <div className="p-lg">
      <Card gradient>
        <h1 className="text-4xl font-bold text-white mb-lg">Markt</h1>
      </Card>

      <Card className="mt-lg">
        <Input label="Nome" placeholder="Digite..." />
        <Button variant="primary" fullWidth className="mt-lg">
          Enviar
        </Button>
      </Card>
    </div>
  )
}
```

### 4. Customizar

```css
/* Mudar cor primária */
:root {
  --color-primary: #3b82f6; /* Azul */
}

/* Ajustar spacing */
:root {
  --space-md: 1.25rem; /* 20px */
}
```

---

## 🎬 Animações

### Disponíveis

- `animate-slideUp` — Sobe do bottom
- `animate-slideIn` — Entra da esquerda
- `animate-fadeIn` — Fade suave
- `animate-pulse` — Pulsing (carregando)

### Uso

```tsx
<div className="animate-slideUp">Conteúdo</div>
<Card className="animate-fadeIn">Card com fade</Card>
<Button loading>Loading com pulse</Button>
```

---

## 📊 Variáveis CSS

### Cores
```css
--color-primary
--color-primary-light
--color-primary-dark
--color-accent-red
--color-accent-green
--color-accent-amber
--color-accent-purple
```

### Espaçamento
```css
--space-xs (4px)
--space-sm (8px)
--space-md (16px)
--space-lg (24px)
--space-xl (32px)
--space-2xl (48px)
```

### Typography
```css
--font-size-xs, --font-size-sm, ..., --font-size-4xl
--font-weight-light, --font-weight-normal, ..., --font-weight-bold
--line-height-tight, --line-height-normal, --line-height-relaxed
```

### Shadows
```css
--shadow-sm
--shadow-md
--shadow-lg
--shadow-xl
```

### Radius
```css
--radius-sm (6px)
--radius-md (12px)
--radius-lg (20px)
--radius-xl (30px)
--radius-full (9999px)
```

---

## 🔄 Próximos Passos

- [ ] Integrar com páginas existentes do Markt
- [ ] Criar componentes adicionais (Modal, Dropdown, Select)
- [ ] Adicionar animações de transição entre páginas
- [ ] Implementar dark mode toggle manual
- [ ] Criar componentes para membros (Invite, MemberCard)
- [ ] Adicionar notificações (Toast, Alert)
- [ ] Implementar loading states

---

## 📚 Arquivos Relacionados

- **[DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)** — Documentação completa
- **[PLANO_ORGANIZADOR_FAMILIAR.md](../PLANO_ORGANIZADOR_FAMILIAR.md)** — Strategy
- **[GUIA_IMPLEMENTACAO.md](../GUIA_IMPLEMENTACAO.md)** — Roadmap

---

## 🎯 Características

✅ **Revolut-Inspired** — Design minimalista e moderno  
✅ **Responsive** — Mobile-first, funciona em qualquer tela  
✅ **Dark Mode** — Suporta preferências do sistema  
✅ **Performático** — CSS puro, sem overhead  
✅ **Acessível** — Cores com bom contraste, semântica HTML  
✅ **Rápido** — Animações suaves (150-300ms)  
✅ **Extensível** — Componentes modulares, fácil customizar  

---

**Criado em:** 2026-07-03  
**Versão:** 1.0.0  
**Status:** 🟢 Pronto para desenvolvimento
