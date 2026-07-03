# Revolut-Style Design System — Markt Familiar

Interface moderna, minimalista e responsiva inspirada em Revolut.

## 🎨 O Que Foi Criado

### 1. Design System CSS
**Arquivo:** `src/styles/design-system.css`

Variáveis e componentes base:
- **Cores:** Indigo/Purple gradients (Revolut-inspired)
- **Spacing:** Sistema de espaçamento 8px
- **Typography:** Familia de fontes do sistema
- **Shadows:** Glassmorphic
- **Animations:** Transições suaves
- **Dark mode:** Suporte nativo

### 2. Componentes React
**Pasta:** `src/components/UI/`

#### Button
```tsx
<Button variant="primary" size="md" fullWidth loading={false}>
  Click me
</Button>

// Variantes: primary | secondary | ghost | danger
// Tamanhos: sm | md | lg
```

#### Card
```tsx
<Card gradient={false} compact={false}>
  Conteúdo aqui
</Card>
```

#### Input
```tsx
<Input
  label="Nome"
  placeholder="Digite..."
  error="Campo obrigatório"
  icon="📝"
/>
```

#### Badge
```tsx
<Badge variant="success">
  ✓ Ativo
</Badge>

// Variantes: primary | success | warning | danger
```

### 3. Páginas Implementadas

#### CircleDashboard.tsx
- Seletor de círculos
- Quick stats (cards em grid)
- Listas compartilhadas
- Atividade da família
- Bottom navigation

#### CreateCircle.tsx
- Step 1: Informações básicas
- Step 2: Convidar membros
- Emoji picker
- Form validation

#### SharedLists.tsx
- Tabs de listas
- Progress bar
- Items organizados por categoria
- Checkbox para marcar items
- Floating action button

#### Calendar.tsx
- Month view com navegação
- Day selection
- Event cards com cores
- Participant status (accepted/declined/tentative)
- Upcoming events list

---

## 🚀 Como Usar

### 1. Importar Design System
```tsx
// Em qualquer componente
import '../styles/design-system.css';
```

### 2. Usar Componentes Base
```tsx
import { Button, Card, Input, Badge } from '../components/UI';

export function MyComponent() {
  return (
    <div className="p-lg">
      <Card>
        <h2 className="text-2xl font-bold mb-lg">Título</h2>
        <Input label="Nome" placeholder="Digite..." />
        <Button variant="primary" fullWidth className="mt-lg">
          Enviar
        </Button>
      </Card>
    </div>
  );
}
```

### 3. Utility Classes

#### Spacing
```html
<!-- Padding: p-xs, p-sm, p-md, p-lg, p-xl -->
<div class="p-lg"></div>

<!-- Margin: m-xs, m-sm, m-md, m-lg, m-xl -->
<div class="m-md"></div>

<!-- Gap: gap-xs, gap-sm, gap-md, gap-lg, gap-xl -->
<div class="flex gap-md"></div>
```

#### Flexbox
```html
<div class="flex gap-md">                    <!-- row + gap -->
<div class="flex flex-col gap-lg">           <!-- column -->
<div class="flex-center">                    <!-- center items -->
```

#### Text
```html
<p class="text-primary">Texto principal</p>
<p class="text-secondary">Texto secundário</p>
<p class="font-bold">Bold</p>
<p class="font-semibold">Semibold</p>
```

#### Rounded
```html
<div class="rounded-lg">Normal</div>
<div class="rounded-xl">Extra large</div>
<div class="rounded-full">Círculo</div>
```

#### Animations
```html
<div class="animate-slideUp">Slide from bottom</div>
<div class="animate-slideIn">Slide from left</div>
<div class="animate-fadeIn">Fade in</div>
<div class="animate-pulse">Pulsing</div>
```

---

## 🎨 Color Palette

### Primary Colors
- `--color-primary: #6366f1` (Indigo)
- `--color-primary-light: #818cf8`
- `--color-primary-dark: #4f46e5`

### Accent Colors
- `--color-accent-red: #ef4444` (Alerts)
- `--color-accent-green: #10b981` (Success)
- `--color-accent-amber: #f59e0b` (Warnings)
- `--color-accent-purple: #a855f7` (Premium)

### Gradients
- `--gradient-primary`: Indigo → Purple
- `--gradient-warm`: Amber → Red
- `--gradient-success`: Green → Cyan

---

## 📐 Spacing Scale

```
xs = 4px   (0.25rem)
sm = 8px   (0.5rem)
md = 16px  (1rem)
lg = 24px  (1.5rem)
xl = 32px  (2rem)
2xl = 48px (3rem)
```

---

## 🔤 Typography

### Font Sizes
```
xs = 12px   (0.75rem)
sm = 14px   (0.875rem)
base = 16px (1rem)
lg = 18px   (1.125rem)
xl = 20px   (1.25rem)
2xl = 24px  (1.5rem)
3xl = 30px  (1.875rem)
4xl = 36px  (2.25rem)
```

### Font Weights
```
light = 300
normal = 400
medium = 500
semibold = 600
bold = 700
```

---

## 🎬 Animations

```css
/* 150ms - Fast interactions */
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);

/* 200ms - Standard */
--transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);

/* 300ms - Slow */
--transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
```

### Predefined Animations
- `animate-slideUp` — Sobe com fade
- `animate-slideIn` — Entra pela esquerda
- `animate-fadeIn` — Fade simples
- `animate-pulse` — Pulsing effect

---

## 📱 Responsiveness

O design system é mobile-first. Use media queries se necessário:

```css
/* Desktop tweaks */
@media (min-width: 768px) {
  .container {
    max-width: 1200px;
    margin: 0 auto;
  }
}
```

Componentes como `grid` já são responsivos:
```tsx
<div className="grid grid-cols-2 gap-md">
  {/* 2 colunas em mobile, adapta com CSS */}
</div>
```

---

## 🌙 Dark Mode

Suporte automático. O design system detecta `prefers-color-scheme`:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: #0f172a;
    --text-primary: #f1f5f9;
    /* ... */
  }
}
```

Componentes adaptam automaticamente sem código extra.

---

## ✅ Componentes Prontos

- ✅ Button (4 variantes, 3 tamanhos)
- ✅ Card (2 estilos)
- ✅ Input (com label, error, icon)
- ✅ Badge (4 variantes)
- ⏳ Select (em desenvolvimento)
- ⏳ Modal (em desenvolvimento)
- ⏳ Tooltip (em desenvolvimento)
- ⏳ Dropdown (em desenvolvimento)

---

## 🔧 Customização

### Mudar cor primária
```css
:root {
  --color-primary: #3b82f6; /* Blue em vez de Indigo */
}
```

### Ajustar spacing
```css
:root {
  --space-md: 1.25rem; /* 20px em vez de 16px */
}
```

### Alterar fonte
```css
:root {
  --font-family-base: 'Inter', sans-serif;
}
```

---

## 📦 Estrutura de Arquivo

```
frontend/
├── src/
│   ├── styles/
│   │   └── design-system.css          ← Import global
│   ├── components/
│   │   └── UI/
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Input.tsx
│   │       ├── Badge.tsx
│   │       └── index.ts
│   ├── pages/
│   │   ├── CircleDashboard.tsx        ← Exemplo
│   │   ├── CreateCircle.tsx           ← Exemplo
│   │   ├── SharedLists.tsx            ← Exemplo
│   │   └── Calendar.tsx               ← Exemplo
│   └── main.tsx                       ← import design-system.css aqui
```

---

## 📖 Exemplo Completo

```tsx
import { Button, Card, Input, Badge } from '../components/UI';

export function FamilyInvite() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 p-lg">
      <div className="max-w-2xl mx-auto">
        <Card gradient className="mb-xl">
          <h1 className="text-4xl font-bold text-white mb-md">Markt Familiar</h1>
          <p className="text-white/80">Organize suas compras em família</p>
        </Card>

        <Card>
          <h2 className="text-2xl font-bold mb-lg">Convide um Membro</h2>

          <Input
            label="Email"
            type="email"
            placeholder="nome@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon="📧"
            className="mb-lg"
          />

          <div className="flex gap-md">
            <Button variant="ghost" fullWidth>
              Cancelar
            </Button>
            <Button
              variant="primary"
              fullWidth
              loading={loading}
              onClick={async () => {
                setLoading(true);
                // API call
                setLoading(false);
              }}
            >
              Enviar Convite
            </Button>
          </div>

          <Badge variant="success" className="mt-lg w-full text-center">
            ✓ Email enviado!
          </Badge>
        </Card>
      </div>
    </div>
  );
}
```

---

## 🎯 Próximos Passos

1. Importar `design-system.css` em `main.tsx`
2. Criar componentes adicionais (Modal, Dropdown, Select)
3. Integrar com páginas existentes do Markt
4. Adicionar temas premium (cores adicionais)
5. Implementar animações de transição entre páginas

---

**Criado em:** 2026-07-03  
**Versão:** 1.0  
**Status:** 🟢 Pronto para uso
