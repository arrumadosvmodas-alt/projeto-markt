# Guia de Implementação — Markt Familiar

**Status:** Pronto para começar  
**Data:** 2026-07-03  
**Objetivo:** Transformar Markt de app de compras individual para plataforma de organização familiar

---

## 📋 Documentação Principal

Este projeto será documentado em 3 arquivos:

1. **[PLANO_ORGANIZADOR_FAMILIAR.md](./PLANO_ORGANIZADOR_FAMILIAR.md)** — Estratégia de produto, roadmap, métricas
2. **[ARQUITETURA_TECNICA.md](./ARQUITETURA_TECNICA.md)** — Stack técnico, code examples, checklist
3. **[GUIA_IMPLEMENTACAO.md](./GUIA_IMPLEMENTACAO.md)** (este arquivo) — Steps práticos para começar

---

## 🎯 Visão Geral em 1 Minuto

**O que é:** Expandir o Markt para que famílias possam compartilhar listas de compras, calendário, tarefas e comunicação.

**Modelo de negócio:**
- **Free:** 1 círculo, listas compartilhadas, calendário básico, tarefas
- **Premium ($4.99/mês):** Múltiplos círculos, Google Calendar sync, documentos, meal planner, budget, localização

**Timeline:** 12-18 meses em 7 fases (MVP em 8 semanas)

**Diferencial:** Não é clone do FamilyWall — é Markt + contexto de compras + análise de economia doméstica

---

## 🚀 Começar Agora (Esta Semana)

### 1. Setup Local

```bash
# Clonar e instalar
cd Projeto\ Markt/backend
cp .env.example .env
npm install
npx prisma migrate dev

cd ../frontend
npm install
npm run dev

# Em outro terminal
cd backend
npm run dev
```

Ambos devem estar rodando em `localhost:5173` (frontend) e `localhost:4000` (backend).

### 2. Revisar Schema Atual

Abra `backend/prisma/schema.prisma` e entenda:
- `User` — dados do usuário
- `Purchase` — uma compra
- `PurchaseItem` — item da compra
- `Product` — produto (barcode)
- `Market` — mercado/supermercado

### 3. Criar Primeira Branch

```bash
cd Projeto\ Markt
git checkout -b feature/phase-1-circles
```

---

## 📊 Phase 1: MVP Círculos + Listas Compartilhadas (8 Semanas)

### Semana 1-2: Schema & Auth

**Objetivo:** Setup de multi-tenancy

**Tarefas:**
```
□ Adicionar tabelas ao schema.prisma:
  □ circles
  □ circle_members
  □ invitations
  □ shared_lists (renomear/adaptar purchases)
  □ shared_list_items (renomear/adaptar purchase_items)

□ Gerar migrations: npx prisma migrate dev

□ Atualizar auth:
  □ JWT incluir circleId
  □ Middleware validar circleId
  □ RBAC: owner, admin, adult, child, guest

□ Testes unitários: auth.service.test.ts
```

**Referência:** Veja `ARQUITETURA_TECNICA.md` seção 2 (Auth Multi-Circle)

**Commit:**
```bash
git commit -m "Schema: add circles, members, invitations for multi-tenancy"
```

---

### Semana 3: Circle API

**Objetivo:** CRUD de círculos

**Tarefas:**
```
□ Criar src/services/circle.service.ts
  □ createCircle(name, ownerId)
  □ getCircles(userId) — listar círculos do usuário
  □ getCircleDetails(circleId) — com membros
  □ updateCircle(circleId, name, avatar)
  □ deleteCircle(circleId) — only owner
  □ addMember(circleId, userId, role)
  □ removeMember(circleId, userId)
  □ leaveCircle(circleId, userId)

□ Criar src/routes/circles.routes.ts
  □ POST /circles
  □ GET /circles
  □ GET /circles/{id}
  □ PATCH /circles/{id}
  □ DELETE /circles/{id}
  □ GET /circles/{id}/members
  □ DELETE /circles/{id}/members/{memberId}

□ Testes: circle.service.test.ts, circles.routes.test.ts
```

**Commit:**
```bash
git commit -m "Feature: Circle CRUD endpoints"
```

---

### Semana 4: Invitations API

**Objetivo:** Sistema de convites

**Tarefas:**
```
□ Criar src/services/invitation.service.ts
  □ createInvitation(circleId, email, invitedBy)
  □ generateToken() — único e expirado em 7 dias
  □ acceptInvitation(token, userId)
  □ rejectInvitation(token)
  □ getCircleInvitations(circleId)

□ Criar src/routes/invitations.routes.ts
  □ POST /circles/{id}/invitations (criar)
  □ GET /circles/{id}/invitations (listar)
  □ POST /invitations/{token}/accept
  □ DELETE /invitations/{token}

□ Enviar email com token
  □ Email template: "Você foi convidado para [Circle Name]"
  □ Link: https://markt.app/invite/{token}

□ Testes: invitation.service.test.ts
```

**Commit:**
```bash
git commit -m "Feature: Invitation system with email"
```

---

### Semana 5: Adapt Purchases para Compartilhado

**Objetivo:** Fazer listas de compras funcionar por círculo

**Tarefas:**
```
□ Atualizar Purchase schema
  □ Adicionar circle_id
  □ Adicionar shared_with_members (array de user_ids)
  □ Mudar de "compra individual" para "lista compartilhada"

□ Refatorar Purchase API
  □ POST /circles/{id}/purchases → criar lista
  □ GET /circles/{id}/purchases → listar listas
  □ GET /purchases/{id} → detalhes com membros
  □ POST /purchases/{id}/items → adicionar item
  □ PATCH /purchases/{id}/items/{itemId} → marcar item
  □ PATCH /purchases/{id}/items/{itemId}/check → marcar por quem?

□ Testes: purchase.service.test.ts com multi-user
```

**Commit:**
```bash
git commit -m "Feature: Adapt purchases to shared lists (circle-based)"
```

---

### Semana 6: Frontend Circle Selector

**Objetivo:** UI para trocar entre círculos

**Tarefas:**
```
□ Criar src/components/CircleSelector/
  □ Dropdown com lista de círculos do usuário
  □ Exibir nome + avatar + role
  □ Ao clicar, mudar circleId no Zustand
  □ Salvar preferência em localStorage

□ Criar src/pages/Circles.tsx
  □ Listar meus círculos
  □ Botão "Criar novo círculo"
  □ Botão "Convidar membro"
  □ Listar membros com role badge
  □ Botão "Sair" (se não for owner)
  □ Botão "Deletar" (se for owner)

□ Criar src/pages/CreateCircle.tsx
  □ Form: nome do círculo
  □ Selecionar 1+ pessoas para convidar
  □ Enviar convites

□ Integrar ao Dashboard
  □ Navigation: Compras | Calendário | ... | Círculos
  □ CircleSelector no header
```

**Commit:**
```bash
git commit -m "UI: Circle selector and management"
```

---

### Semana 7: WebSocket + Realtime Sync

**Objetivo:** Múltiplas pessoas vendo lista atualizar em tempo real

**Tarefas:**
```
□ Backend: socket.io setup
  □ Instalar: npm install socket.io
  □ Criar src/websocket/handlers.ts
  □ Emitir 'purchase:item-added' quando item adicionado
  □ Emitir 'purchase:item-checked' quando item marcado
  □ Broadcast apenas para círculo

□ Frontend: WebSocket connection
  □ Instalar: npm install socket.io-client
  □ Hook: src/hooks/useWebSocket.ts
  □ Conectar ao entrar em Circle
  □ Ouvir 'purchase:item-added'
  □ Ouvir 'purchase:item-checked'
  □ Atualizar Zustand store (realtime)

□ Testes: E2E com 2 browsers
  □ Browser A: adiciona item
  □ Browser B: vê aparecer em < 1s
```

**Commit:**
```bash
git commit -m "Feature: WebSocket realtime purchase updates"
```

---

### Semana 8: Offline-First Sync

**Objetivo:** Funcionar sem internet (mercado)

**Tarefas:**
```
□ Frontend: IndexedDB setup
  □ src/services/localDB.ts
  □ Stores: purchases, items, outbox
  □ Instalar: npm install idb

□ Frontend: Sync engine
  □ src/services/sync.ts
  □ Salvar offline em IndexedDB
  □ Auto-sync a cada 30s quando online
  □ POST /circles/{id}/sync com conflictos

□ Backend: Sync endpoint
  □ POST /circles/{id}/sync
  □ Receber: items com clientOperationId
  □ Responder: versão atualizada + server changes
  □ Conflict resolution: last-write-wins por field

□ Testes: offline scenario
  □ Desabilitar internet (DevTools)
  □ Adicionar item offline
  □ Ativar internet
  □ Verificar sincronização automática
  □ Verificar resultado final

□ Testes: conflito
  □ Usuário A edita offline
  □ Usuário B edita online
  □ Ambos sincronizam
  □ Resultado final coerente
```

**Referência:** `ARQUITETURA_TECNICA.md` seção 3 (Offline-First Sync)

**Commit:**
```bash
git commit -m "Feature: Offline-first sync with IndexedDB"
```

---

## 🎬 MVP Testing & Deploy

### Semana 8 (cont): Beta Testing

```bash
# Deploy para staging
npm run build
# Fazer deploy em Fly.io ou similar

# Convidar 5 famílias para testar
# Email com link de staging

# Monitorar:
□ Sync failure rate (deve ser < 0.1%)
□ Feedback de UX
□ Bugs

# Iterar com feedback
```

---

## 📱 Phase 2: Calendário + Tarefas + Chat (10 Semanas)

Quando MVP 1 estiver estável (com 10+ famílias ativas):

1. **Calendário** (`src/services/event.service.ts`)
   - Criar evento
   - Editar/deletar
   - Recorrência (RRULE)
   - Participantes + RSVP
   - Comentários
   - Reminders

2. **Tarefas** (`src/services/task.service.ts`)
   - Criar tarefa
   - Atribuir membro
   - Marcar completa
   - Recorrência
   - Checklist
   - Commentários

3. **Chat** (`src/services/message.service.ts`)
   - Mensagens por círculo
   - Threads (em evento/tarefa/lista)
   - Reações (emoji)
   - WebSocket em tempo real
   - Push notifications

4. **Google Calendar Sync** (read-only)
   - OAuth Google
   - Importar eventos
   - Bidirecional depois

---

## 🛡️ Segurança desde o Início

### Obrigatório para MVP

```typescript
// .env.example
JWT_SECRET=min-32-chars-random-secret
JWT_EXPIRES_IN=900 # 15 min
REFRESH_TOKEN_EXPIRES_IN=604800 # 7 dias

// backend/src/middleware/auth.ts
- Verificar JWT validade
- Verificar circleId no token
- Rate limit: 5 login/min por IP
- Hashing: bcryptjs com 12 rounds
```

**Checklist de segurança:**
```
□ HTTPS em produção (Let's Encrypt via Fly.io)
□ CORS configurado (https://markt.app apenas)
□ Rate limiting em /auth/login
□ Soft deletes (deleted_at) para recuperação
□ Logs de auditoria (quem editou o quê)
□ MFA opcional (TOTP)
□ Consentimento para localização
```

---

## 📊 Métricas de Sucesso

### Ativação (Primeira semana)
```
✓ Usuário criou círculo
✓ Convidou 1+ membro
✓ Ambos adicionaram 1+ item na lista
✓ Viram atualizar em realtime
```

**Meta:** 50% dos novos usuários ativam em 24h

### Engajamento (Semanal)
```
✓ % de círculos com 1+ ação/semana
✓ Tempo médio em app/dia
✓ Items checados/círculo/semana
```

**Meta:** 70% WAC (Weekly Active Circles)

### Confiabilidade
```
✓ Sync failure rate < 0.1%
✓ API uptime > 99.9%
✓ Push delivery > 99%
```

---

## 🏗️ Checklist MVP 1: Antes de Deploy

- [ ] Schema: 5 tabelas novas (circle, member, invitation, shared_list, shared_list_item)
- [ ] Auth: JWT com circleId, RBAC middleware
- [ ] Circles API: CRUD + membros (12 endpoints)
- [ ] Invitations: Email com token, aceitar/rejeitar
- [ ] Purchases adaptadas: circle-based, compartilhado
- [ ] WebSocket: realtime updates
- [ ] IndexedDB: sync offline com conflict resolution
- [ ] Frontend: Circle selector, gerenciar membros
- [ ] Tests: Unit + integration + E2E
- [ ] Deploy: Staging com monitoring
- [ ] Beta: 5+ famílias testando 1 semana
- [ ] Feedback: Coletado e iterado
- [ ] Production deploy + monitoring

---

## 🔄 Deploy Checklist

### Antes de Produção

```bash
# 1. Testes
npm run test

# 2. Build
npm run build

# 3. Migrations (Staging primeiro)
npx prisma migrate deploy --preview-feature

# 4. Environment variables
# Verificar .env.example vs realidade em produção

# 5. Backup database
# Exportar staging DB antes de deploy

# 6. Monitoring setup
# Sentry, DataDog, logs

# 7. Deploy
git push origin feature/phase-1-circles
# Create PR, review, merge, deploy via CI/CD
```

---

## 📚 Referências Principais

| Documento | Seção Relevante |
|-----------|-----------------|
| PLANO_ORGANIZADOR_FAMILIAR.md | Seção 5 (Schema), Seção 6 (APIs), Seção 7 (Sync) |
| ARQUITETURA_TECNICA.md | Seção 1 (Pastas), Seção 2 (Auth), Seção 3 (Sync) |
| Current codebase | `/backend/prisma/schema.prisma`, `/backend/src/routes` |

---

## 🆘 Troubleshooting

### Docker não sobe
```bash
docker-compose down --volumes
docker-compose up --build
```

### Prisma migration conflict
```bash
npx prisma migrate resolve --rolled-back <migration-name>
npx prisma migrate deploy
```

### WebSocket não funciona
- Verificar `src/index.ts` tem `io.listen(server)`
- Cliente tem token JWT válido no `auth` do socket.io
- CORS permitindo WebSocket

### Sync não sincroniza offline
- Verificar IndexedDB em DevTools > Application
- Verificar outbox table tem items
- Verificar network em DevTools (POST /sync)

---

## 🎓 Aprendizado Contínuo

Recursos recomendados:

- **Prisma:** https://www.prisma.io/docs/
- **Socket.io:** https://socket.io/docs/
- **React Query:** https://tanstack.com/query/latest
- **Offline-first:** https://localfirstweb.dev/
- **RBAC:** https://casbin.org/

---

## 📞 Contato & Feedback

Este documento é vivo. Após cada semana de desenvolvimento:

1. Atualizar progresso no checklist
2. Documentar decisões tomadas
3. Adicionar learnings

**Próximas reviews:**
- Week 2: Schema aprovada?
- Week 4: Auth funcionando multi-circle?
- Week 6: UI sem bugs?
- Week 8: MVP pronto para beta?

---

**Última atualização:** 2026-07-03  
**Próxima revisão:** 2026-07-10  
**Status:** 🟢 Pronto para começar
