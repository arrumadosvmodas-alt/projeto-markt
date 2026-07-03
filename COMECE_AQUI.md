# ▶️ COMECE AQUI — Markt Familiar

**Você foi designado para transformar Markt em uma plataforma de organização familiar.**

Este arquivo guia você pelos recursos. Leia isto primeiro. Depois escolha seu caminho.

---

## 📖 Os 3 Documentos

### 1. 🎯 [PLANO_ORGANIZADOR_FAMILIAR.md](./PLANO_ORGANIZADOR_FAMILIAR.md)
**O QUÊ e POR QUÊ fazer**

Leia se você quer entender:
- Visão do produto (qual é o objetivo?)
- Modelo de negócio (free vs premium)
- Roadmap (7 fases em 18 meses)
- Arquitetura geral (diagrama)
- Dados principais (20+ tabelas novas)
- APIs (50+ endpoints)
- Riscos técnicos
- Métricas de sucesso

**Tempo de leitura:** 30 min  
**Para quem:** PM, arquiteto, tech lead

---

### 2. 🛠️ [ARQUITETURA_TECNICA.md](./ARQUITETURA_TECNICA.md)
**COMO implementar (código + exemplos)**

Leia se você quer:
- Estrutura de pastas (backend + frontend)
- Exemplos de código (TypeScript reais)
- Setup de auth multi-circle
- Sync offline-first (IndexedDB)
- WebSocket realtime
- Notificações push
- Docker Compose
- Checklist MVP

**Tempo de leitura:** 45 min  
**Para quem:** Backend/frontend dev, DevOps

---

### 3. 🚀 [GUIA_IMPLEMENTACAO.md](./GUIA_IMPLEMENTACAO.md)
**PASSOS SEMANAIS para Phase 1 (MVP)**

Leia se você quer:
- Começar **hoje**
- Saber exatamente o que fazer **cada semana**
- Tarefas concretas (checklist)
- Commits esperados
- Testes a escrever
- Deploy strategy

**Tempo de leitura:** 15 min  
**Para quem:** Engenheiro de implementação

---

## 🎓 Escolha Seu Caminho

### Caminho A: Sou PM/Produto
```
1. Leia PLANO_ORGANIZADOR_FAMILIAR.md (inteiro)
   ↓ Entenda produto, roadmap, negócio
2. Leia GUIA_IMPLEMENTACAO.md (seção "Visão Geral")
   ↓ Veja timeline realista
3. Compartilhe com time o checklist de MVP
```

### Caminho B: Sou Backend/Frontend Engineer
```
1. Leia GUIA_IMPLEMENTACAO.md (inteiro)
   ↓ Saiba o que fazer primeira semana
2. Leia ARQUITETURA_TECNICA.md (suas seções)
   ↓ Code examples + estrutura
3. Clone repo, faça setup, comece primeira tarefa
```

### Caminho C: Sou Tech Lead/Arquiteto
```
1. Leia PLANO_ORGANIZADOR_FAMILIAR.md (seções 4-6)
   ↓ Entenda arquitetura geral
2. Leia ARQUITETURA_TECNICA.md (inteiro)
   ↓ Valide stack + design
3. Leia GUIA_IMPLEMENTACAO.md
   ↓ Aprove roadmap semanal
```

---

## ⚡ TL;DR — 2 Minutos

**Resumão:**
- Markt agora é individual (cada um controla suas compras)
- Objetivo: Expandir para **familiar** (família compartilha tudo)
- MVP em 8 semanas: círculos + listas compartilhadas + sync offline
- Phase 2-7: calendário, tarefas, chat, docs, orçamento, etc

**Stack:**
- Backend: Node.js + Express + Prisma + PostgreSQL
- Frontend: React + Vite + Zustand + TanStack Query
- Realtime: WebSocket + Redis Pub/Sub
- Offline: IndexedDB
- Database: PostgreSQL (já está)

**Timeline:**
```
Phase 1 (8 sem)  → Círculos + Listas
Phase 2 (10 sem) → Calendário + Tarefas + Chat
Phase 3 (6 sem)  → Sync Offline
Phase 4 (6 sem)  → Assinatura Premium
Phase 5 (8 sem)  → Localização + Docs
Phase 6 (6 sem)  → Meal Planner + Budget
Phase 7 (10 sem) → IA + Diferenciais
```

**Começar:**
```bash
cd Projeto\ Markt
git checkout -b feature/phase-1-circles
```

---

## 🎬 Primeira Semana (Setup)

### Dia 1-2: Setup + Revisão
- [ ] Clonar repo, instalar, rodar localmente
- [ ] Revisar `backend/prisma/schema.prisma` atual
- [ ] Revisar arquitetura do Markt (README.md original)
- [ ] Ler `PLANO_ORGANIZADOR_FAMILIAR.md` seções 1-3

### Dia 3-4: Planning
- [ ] Ler `GUIA_IMPLEMENTACAO.md` inteiro
- [ ] Marcar tarefas das 8 semanas de MVP
- [ ] Validar com time (PM, outros devs)
- [ ] Criar issues no GitHub (1 por semana)

### Dia 5: Primeira tarefa
- [ ] Leia `ARQUITETURA_TECNICA.md` seção 2 (Auth Multi-Circle)
- [ ] Comece a escrever schema de Circle, CircleMember
- [ ] Primeiro commit: "Schema: add circles for multi-tenancy"

---

## 📂 Estrutura Nova (Overview)

```
backend/
  ├── src/
  │   ├── services/
  │   │   ├── circle.service.ts        [NOVO]
  │   │   ├── invitation.service.ts    [NOVO]
  │   │   ├── event.service.ts         [FASE 2]
  │   │   ├── task.service.ts          [FASE 2]
  │   │   ├── sync.service.ts          [FASE 3]
  │   │   └── ... (10+ services)
  │   ├── routes/
  │   │   ├── circles.routes.ts        [NOVO]
  │   │   ├── invitations.routes.ts    [NOVO]
  │   │   └── ...
  │   ├── websocket/                   [NOVO]
  │   ├── workers/                     [NOVO]
  │   └── ...
  └── prisma/
      └── schema.prisma (adicionar 18+ tabelas)

frontend/
  ├── src/
  │   ├── pages/
  │   │   ├── Circles.tsx              [NOVO]
  │   │   ├── Calendar.tsx             [FASE 2]
  │   │   ├── Tasks.tsx                [FASE 2]
  │   │   └── ...
  │   ├── components/
  │   │   ├── CircleSelector/          [NOVO]
  │   │   ├── CalendarView/            [FASE 2]
  │   │   └── ...
  │   ├── services/
  │   │   ├── sync.ts                  [NOVO]
  │   │   ├── localDB.ts               [NOVO]
  │   │   └── ...
  │   ├── hooks/
  │   │   ├── useWebSocket.ts          [NOVO]
  │   │   ├── useOfflineSync.ts        [NOVO]
  │   │   └── ...
  │   └── stores/
  │       ├── circle.store.ts          [NOVO]
  │       └── ...
```

---

## 🔑 Conceitos Principais

### 1. Circle (Círculo Familiar)
Um grupo de pessoas (ex: família) que compartilham dados isolados. Um usuário pode estar em vários círculos.

```
User Alice
  ├─ Circle "Minha Família" (owner)
  │   └─ Membros: Alice, Bob, Charlie
  └─ Circle "Amigos" (member)
      └─ Membros: Alice, Diana, Eve
```

### 2. RBAC (Role-Based Access Control)
Cada membro tem um papel que determina permissões:

| Role  | Pode criar | Pode editar | Pode deletar | Pode gerenciar |
|-------|----------|----------|---------|----------|
| Owner | ✓ | ✓ | ✓ | ✓ (tudo) |
| Admin | ✓ | ✓ | ✓ | Membros |
| Adult | ✓ | Seu próprio | Seu próprio | - |
| Child | ✓ | Próprio | Próprio | - |
| Guest | - | - | - | - |

### 3. Offline-First
Cliente funciona 100% offline. Quando online, sincroniza automaticamente com servidor.

```
Cliente                     Servidor
────────────────────────────────────
[IndexedDB] (sempre)        [PostgreSQL]
    ↓
[Outbox] (fila de sync)
    ↓
[WebSocket/HTTP] (quando online) → Sync endpoint
```

### 4. Realtime
Quando alguém muda dados (adiciona item, marca tarefa), todos veem em < 1 segundo via WebSocket.

```
Alice adiciona item
    ↓
Backend salva DB + emite via WebSocket
    ↓
Bob, Charlie veem aparecer
```

---

## 🎯 MVP 1 Success Criteria

Quando MVP 1 está **done** (semana 8):

- [ ] 2+ pessoas conseguem criar círculo
- [ ] Convidar 1+ membro por email
- [ ] Aceitar convite
- [ ] Compartilhar lista de compras
- [ ] Ambos veem atualizar em realtime
- [ ] Offline: adiciona item sem internet, sincroniza depois
- [ ] Sem bugs críticos
- [ ] < 0.1% sync failure rate
- [ ] 5+ famílias em beta por 1 semana

**Se tudo acima:** 🟢 Go para Phase 2

---

## 📊 Métricas Minhas

**Acompanhar durante MVP 1:**

| Métrica | Meta | Como medir |
|---------|------|-----------|
| Ativação em 24h | 50% | User criou círculo + convidou alguém |
| WAC (Weekly Active Circles) | 70% | % com 1+ ação/semana |
| Sync failure rate | < 0.1% | Logs: POST /sync errors |
| API uptime | > 99.9% | Datadog/Sentry |
| Push delivery | > 99% | Notificação logs |

---

## 🆘 Perguntas Comuns

**P: Por onde começo?**  
A: Leia `GUIA_IMPLEMENTACAO.md` seção "Começar Agora". São 5 steps simples.

**P: Quanto tempo leva MVP 1?**  
A: 8 semanas com 1 backend + 1 frontend dev (assumindo Markt código limpo).

**P: Preciso usar a stack recomendada?**  
A: Não totalmente, mas é o recomendado pois já está no projeto. Qualquer mudança, discuta com time.

**P: E se eu encontrar um bug no código atual?**  
A: Corrija em branch separada, faça PR, depois merge. Depois volta pra feature branch.

**P: Posso usar library X em vez de Y?**  
A: Só se equivalente em funcionalidade + conhecimento do time. Discuta antes.

**P: Como reportar progresso?**  
A: Weekly: atualizar `GUIA_IMPLEMENTACAO.md` seção "Phase 1" com ✓/✗.

---

## 🚀 Deploy

**Staging (fim de cada fase):**
```bash
git push origin feature/phase-1-circles
# Create PR, get reviewed, merge
# CI/CD deploys automaticamente para staging
# E2E tests rodam
```

**Production (após beta bem-sucedido):**
```bash
# Manual approval
# Deploy com backup
# Monitor para erros
# Rollback plan se needed
```

---

## 📞 Próximos Passos

1. **Agora:** Leia o documento relevant para seu papel
2. **Hoje:** Setup repo localmente
3. **Amanhã:** Comece primeira tarefa (Week 1 de MVP 1)
4. **Semana 1:** Commit schema de círculos
5. **Semana 2:** Commit auth multi-circle
6. **... (6 semanas mais)**
7. **Semana 8:** Deploy MVP em staging + beta

---

## 🎓 Recursos

- **Docs principais:**
  - [PLANO_ORGANIZADOR_FAMILIAR.md](./PLANO_ORGANIZADOR_FAMILIAR.md)
  - [ARQUITETURA_TECNICA.md](./ARQUITETURA_TECNICA.md)
  - [GUIA_IMPLEMENTACAO.md](./GUIA_IMPLEMENTACAO.md)

- **Tecnologias:**
  - https://www.prisma.io/docs/
  - https://expressjs.com/
  - https://react.dev/
  - https://zustand-demo.vercel.app/
  - https://socket.io/

- **Conceitos:**
  - Offline-first: https://localfirstweb.dev/
  - RBAC: https://en.wikipedia.org/wiki/Role-based_access_control
  - Multi-tenancy: https://en.wikipedia.org/wiki/Multi-tenancy

---

## ✅ Checklist: Estou Pronto?

- [ ] Entendo que Markt vai de individual → familiar
- [ ] Consigo rodar repo localmente (backend + frontend)
- [ ] Conheço meu papel (frontend/backend/PM/lead)
- [ ] Assinei para ler documento relevante
- [ ] Tenho as ferramentas (Node, PostgreSQL, Git, etc)
- [ ] Perguntei o que não entendi
- [ ] Estou pronto para começar Phase 1

---

**Status:** 🟢 PRONTO PARA COMEÇAR

**Última atualização:** 2026-07-03  
**Próxima review:** 2026-07-10

**Boa sorte! 🚀**
