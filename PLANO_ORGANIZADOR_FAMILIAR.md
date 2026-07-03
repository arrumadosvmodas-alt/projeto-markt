# Plano: Markt Familiar — Expansão de Controle de Compras para Organização Familiar

## 1. Contexto Atual

O **Markt** é um app PWA para controle de compras individuais:
- Usuário registra compras em mercados específicos
- Localização e sugestão de mercados
- Leitura de código de barras
- Comparação automática de preços
- Histórico e análises de economia

**Stack atual:**
- Backend: Node.js + Express + TypeScript + Prisma
- Frontend: React + Vite + TypeScript + Tailwind CSS + PWA
- Database: PostgreSQL
- Auth: CPF + JWT

## 2. Visão Expandida

Transformar Markt de um **app de compras individual** para uma **plataforma integrada de organização familiar** que combina:

1. **Compras compartilhadas** — listas de compras para toda a família
2. **Calendário familiar** — agenda compartilhada
3. **Tarefas e afazeres** — responsabilidades distribuídas
4. **Comunicação** — chat básico no círculo familiar
5. **Informações úteis** — contatos, documentos, receitas
6. **Localização** — compartilhamento de localização (opcional)
7. **Análises** — gastos familiares, economia por pessoa

O conceito central é o **Circle** (círculo familiar), que permite:
- Múltiplas pessoas compartilharem dados
- Permissões granulares (owner, admin, adult, child, guest)
- Isolamento de dados por círculo
- Suporte a multi-tenancy nativo

## 3. Modelo de Negócio Revisado

### Free Tier
- 1 círculo (família principal)
- Listas de compras compartilhadas com histórico de 3 meses
- Calendário compartilhado básico
- Tarefas simples
- Chat de texto
- Comparação de preços
- Análises básicas

### Premium ($4.99/mês ou $44.99/ano)
- Círculos ilimitados
- Histórico de compras ilimitado
- Calendário com sincronização Google/Outlook
- Documentos compartilhados
- Meal planner (refeições → lista de compras)
- Budget tracker (orçamento familiar)
- Localização em tempo real
- Safe zones (alertas de chegada/saída)
- Armazenamento estendido
- Áudio/vídeo em chat
- Timetables (horários de aulas/atividades)
- Prioridade em suporte

## 4. Arquitetura — Diagrama Geral

```
┌─────────────────────────────────────────────────────┐
│         Frontend Web (React + Vite)                 │
│  ┌──────────────────────────────────────────────┐   │
│  │ Nav: Compras | Calendário | Tarefas | Chat   │   │
│  │  Tela de Círculos (seletor)                  │   │
│  │  Módulo Compras (atual)                      │   │
│  │  Módulo Calendário (novo)                    │   │
│  │  Módulo Tarefas (novo)                       │   │
│  │  Módulo Chat (novo)                          │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
                        │
                   HTTPS + WebSocket
                        │
┌─────────────────────────────────────────────────────┐
│           Backend (Express + Prisma)                │
│  ┌──────────────────────────────────────────────┐   │
│  │ Auth Service        (login, MFA, reset)      │   │
│  │ User Service        (perfil, preferências)   │   │
│  │ Circle Service      (criar, gerenciar)       │   │
│  │ Invitation Service  (convites, aceitar)      │   │
│  │ Purchase Service    (compras, itens)         │   │
│  │ Product Service     (barcode, Open Food)     │   │
│  │ Market Service      (geoloc, OSM)            │   │
│  │ Calendar Service    (eventos, recorrência)   │   │
│  │ Task Service        (tarefas, chores)        │   │
│  │ Message Service     (chat, threads)          │   │
│  │ Location Service    (compartilhamento)       │   │
│  │ Media Service       (upload, storage)        │   │
│  │ Notification Service (push, e-mail)          │   │
│  │ Billing Service     (assinatura, webhook)    │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        v               v               v
    PostgreSQL      Redis Pub/Sub   S3-compatible
    (data)          (websocket)     (media)
        │               │               │
        └───────────────┼───────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        v               v               v
    Workers        Push Gateway    Email Service
    (scheduler)    (FCM, APNs)      (notifications)
```

## 5. Schema de Dados Expandido

### Tabelas Novas

#### Circle (Círculo Familiar)
```sql
CREATE TABLE circles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id TEXT NOT NULL REFERENCES users(id),
  description TEXT,
  avatar_url TEXT,
  plan VARCHAR(20) DEFAULT 'free', -- 'free' | 'premium'
  storage_limit_bytes BIGINT DEFAULT 5368709120, -- 5GB free
  payment_method TEXT, -- 'none' | 'stripe' | 'paypal' | 'pix'
  subscription_status TEXT, -- 'active' | 'cancelled' | 'past_due'
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_circles_owner ON circles(owner_id);
```

#### CircleMember (Membro do Círculo)
```sql
CREATE TABLE circle_members (
  id TEXT PRIMARY KEY,
  circle_id TEXT NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  role VARCHAR(20) DEFAULT 'adult', -- 'owner' | 'admin' | 'adult' | 'child' | 'guest'
  color TEXT DEFAULT '#3B82F6', -- cor para calendário/tarefas
  nickname TEXT, -- sobrenome ou apelido dentro do círculo
  location_sharing_enabled BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMP DEFAULT NOW(),
  left_at TIMESTAMP,

  UNIQUE(circle_id, user_id),
  CONSTRAINT no_duplicate_active UNIQUE (circle_id, user_id) 
    WHERE left_at IS NULL
);

CREATE INDEX idx_circle_members_circle ON circle_members(circle_id);
CREATE INDEX idx_circle_members_user ON circle_members(user_id);
```

#### Invitation (Convites)
```sql
CREATE TABLE invitations (
  id TEXT PRIMARY KEY,
  circle_id TEXT NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  invited_by_user_id TEXT NOT NULL REFERENCES users(id),
  email TEXT NOT NULL,
  phone TEXT,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,
  accepted_by_user_id TEXT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_invitations_circle ON invitations(circle_id);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_token ON invitations(token);
```

#### CalendarEvent (Evento de Calendário)
```sql
CREATE TABLE calendar_events (
  id TEXT PRIMARY KEY,
  circle_id TEXT NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  starts_at TIMESTAMP NOT NULL,
  ends_at TIMESTAMP,
  timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
  location TEXT,
  recurrence_rule TEXT, -- RRULE format (RFC 5545)
  created_by_user_id TEXT NOT NULL REFERENCES users(id),
  color TEXT DEFAULT '#3B82F6',
  visibility VARCHAR(20) DEFAULT 'family', -- 'family' | 'personal' | 'specific'
  version INTEGER DEFAULT 1,
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_events_circle_date ON calendar_events(circle_id, starts_at);
CREATE INDEX idx_events_created_by ON calendar_events(created_by_user_id);
```

#### EventParticipant (Participante de Evento)
```sql
CREATE TABLE event_participants (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'tentative', -- 'accepted' | 'declined' | 'tentative'
  
  UNIQUE(event_id, user_id)
);

CREATE INDEX idx_event_participants_event ON event_participants(event_id);
CREATE INDEX idx_event_participants_user ON event_participants(user_id);
```

#### EventComment (Comentários em Evento)
```sql
CREATE TABLE event_comments (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_event_comments_event ON event_comments(event_id);
```

#### Task (Tarefas e Afazeres)
```sql
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  circle_id TEXT NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to_user_id TEXT REFERENCES users(id),
  created_by_user_id TEXT NOT NULL REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority VARCHAR(20) DEFAULT 'normal', -- 'low' | 'normal' | 'high' | 'urgent'
  due_at TIMESTAMP,
  due_date DATE,
  recurrence_rule TEXT, -- RRULE format
  completed_at TIMESTAMP,
  visibility VARCHAR(20) DEFAULT 'family', -- 'family' | 'personal'
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tasks_circle_status ON tasks(circle_id, status);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to_user_id);
CREATE INDEX idx_tasks_due_at ON tasks(due_at);
```

#### TaskChecklist (Sub-tarefas/Checklist)
```sql
CREATE TABLE task_checklists (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  order_index INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_task_checklists_task ON task_checklists(task_id);
```

#### SharedList (Listas Compartilhadas - expande Purchase List)
```sql
CREATE TABLE shared_lists (
  id TEXT PRIMARY KEY,
  circle_id TEXT NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'shopping', -- 'shopping' | 'wish' | 'chores' | 'packing'
  description TEXT,
  created_by_user_id TEXT NOT NULL REFERENCES users(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_lists_circle ON shared_lists(circle_id);
```

#### SharedListItem (Itens de Lista Compartilhada)
```sql
CREATE TABLE shared_list_items (
  id TEXT PRIMARY KEY,
  list_id TEXT NOT NULL REFERENCES shared_lists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  quantity FLOAT DEFAULT 1,
  unit TEXT, -- 'kg' | 'l' | 'un' | 'dz' | etc
  category TEXT,
  product_id TEXT REFERENCES products(id),
  checked_by_user_id TEXT REFERENCES users(id),
  checked_at TIMESTAMP,
  priority VARCHAR(20) DEFAULT 'normal',
  notes TEXT,
  client_operation_id TEXT, -- para sync offline
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_list_items_list ON shared_list_items(list_id);
CREATE INDEX idx_list_items_checked ON shared_list_items(checked_by_user_id);
```

#### Message (Mensagens Familiares)
```sql
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  circle_id TEXT NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  thread_type VARCHAR(20) DEFAULT 'general', -- 'general' | 'event' | 'task' | 'list' | 'document'
  thread_id TEXT, -- event_id, task_id, list_id, document_id, etc
  sender_id TEXT NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  media_urls TEXT[], -- JSON array de URLs
  message_type VARCHAR(20) DEFAULT 'text', -- 'text' | 'image' | 'audio' | 'video'
  edited_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_circle ON messages(circle_id);
CREATE INDEX idx_messages_thread ON messages(circle_id, thread_type, thread_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
```

#### MessageReaction (Reações em Mensagens)
```sql
CREATE TABLE message_reactions (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  emoji TEXT NOT NULL, -- '👍' | '❤️' | etc
  
  UNIQUE(message_id, user_id, emoji)
);

CREATE INDEX idx_message_reactions_message ON message_reactions(message_id);
```

#### Location (Localização em Tempo Real)
```sql
CREATE TABLE locations (
  id TEXT PRIMARY KEY,
  circle_id TEXT NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  accuracy FLOAT,
  altitude FLOAT,
  heading FLOAT,
  speed FLOAT,
  address TEXT,
  captured_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_locations_circle_user ON locations(circle_id, user_id);
CREATE INDEX idx_locations_captured_at ON locations(captured_at);
```

#### Place (Locais Monitorados - geofences)
```sql
CREATE TABLE places (
  id TEXT PRIMARY KEY,
  circle_id TEXT NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  radius_meters INTEGER DEFAULT 500,
  place_type VARCHAR(20), -- 'home' | 'work' | 'school' | 'other'
  created_by_user_id TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_places_circle ON places(circle_id);
```

#### PlaceEvent (Evento de Chegada/Saída)
```sql
CREATE TABLE place_events (
  id TEXT PRIMARY KEY,
  place_id TEXT NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  event_type VARCHAR(20) NOT NULL, -- 'arrival' | 'departure'
  occurred_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_place_events_place ON place_events(place_id);
CREATE INDEX idx_place_events_user ON place_events(user_id);
```

#### Document (Documentos Compartilhados)
```sql
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  circle_id TEXT NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  document_type VARCHAR(50), -- 'id' | 'passport' | 'medical' | 'school' | 'contract' | 'insurance' | 'other'
  visibility VARCHAR(20) DEFAULT 'family', -- 'family' | 'specific'
  object_key TEXT NOT NULL, -- S3 path
  mime_type VARCHAR(100),
  size_bytes BIGINT,
  expires_at TIMESTAMP,
  renewal_reminder_at TIMESTAMP,
  uploaded_by_user_id TEXT NOT NULL REFERENCES users(id),
  tags TEXT[], -- JSON array
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_documents_circle ON documents(circle_id);
CREATE INDEX idx_documents_type ON documents(document_type);
```

#### Recipe (Receitas)
```sql
CREATE TABLE recipes (
  id TEXT PRIMARY KEY,
  circle_id TEXT NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  source_url TEXT,
  ingredients_json JSONB, -- [{"name": "arroz", "quantity": 2, "unit": "xícaras"}]
  instructions TEXT,
  prep_time_minutes INTEGER,
  cook_time_minutes INTEGER,
  servings INTEGER,
  tags TEXT[], -- JSON array
  image_url TEXT,
  created_by_user_id TEXT NOT NULL REFERENCES users(id),
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_recipes_circle ON recipes(circle_id);
```

#### MealPlan (Plano de Refeições)
```sql
CREATE TABLE meal_plans (
  id TEXT PRIMARY KEY,
  circle_id TEXT NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meal_type VARCHAR(20) NOT NULL, -- 'breakfast' | 'lunch' | 'snack' | 'dinner'
  recipe_id TEXT REFERENCES recipes(id),
  notes TEXT,
  created_by_user_id TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_meal_plans_circle_date ON meal_plans(circle_id, date);
```

#### BudgetCategory (Categorias de Orçamento)
```sql
CREATE TABLE budget_categories (
  id TEXT PRIMARY KEY,
  circle_id TEXT NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  monthly_limit DECIMAL(12, 2),
  created_by_user_id TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_budget_categories_circle ON budget_categories(circle_id);
```

#### Transaction (Transações Financeiras)
```sql
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  circle_id TEXT NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  category_id TEXT REFERENCES budget_categories(id),
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'BRL',
  description TEXT,
  transaction_type VARCHAR(20) DEFAULT 'expense', -- 'income' | 'expense'
  paid_by_user_id TEXT NOT NULL REFERENCES users(id),
  occurred_at TIMESTAMP NOT NULL,
  receipt_url TEXT,
  tags TEXT[], -- JSON array
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_transactions_circle ON transactions(circle_id);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_transactions_occurred_at ON transactions(occurred_at);
```

#### Notification (Log de Notificações)
```sql
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  circle_id TEXT NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  type VARCHAR(50) NOT NULL, -- 'event_reminder' | 'task_assigned' | 'item_added' | 'message' | 'arrival' | 'departure'
  title TEXT NOT NULL,
  body TEXT,
  data JSONB, -- relacionados a event_id, task_id, etc
  channel VARCHAR(20) DEFAULT 'push', -- 'push' | 'email' | 'sms'
  sent_at TIMESTAMP,
  read_at TIMESTAMP,
  delivery_status VARCHAR(20) DEFAULT 'pending', -- 'pending' | 'sent' | 'failed'
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, read_at);
CREATE INDEX idx_notifications_circle ON notifications(circle_id);
```

#### Subscription (Assinatura Premium)
```sql
CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY,
  circle_id TEXT NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  provider VARCHAR(20) NOT NULL, -- 'stripe' | 'apple' | 'google_play'
  provider_customer_id TEXT,
  provider_subscription_id TEXT UNIQUE,
  status VARCHAR(20) DEFAULT 'active', -- 'active' | 'cancelled' | 'past_due' | 'trialing'
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  cancel_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_circle ON subscriptions(circle_id);
```

### Tabelas Modificadas

#### User (adicionar campos)
```sql
ALTER TABLE users ADD COLUMN (
  email TEXT UNIQUE,
  phone TEXT,
  avatar_url TEXT,
  locale VARCHAR(10) DEFAULT 'pt-BR',
  timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
  notification_preferences JSONB DEFAULT '{"email": true, "push": true, "sms": false}',
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Purchase (adicionar círculo)
```sql
ALTER TABLE purchases ADD COLUMN (
  circle_id TEXT REFERENCES circles(id),
  shared_with_members TEXT[] -- JSON array de user_ids
);

-- Migração: Se circleId não existe, criar circle padrão por user
```

## 6. Novas APIs

### Auth & User
```http
POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout
POST /auth/password-reset
POST /auth/verify-email
POST /auth/verify-phone
GET /users/me
PATCH /users/me
DELETE /users/me
```

### Circles
```http
POST /circles                              # Criar círculo
GET /circles                               # Listar círculos do usuário
GET /circles/{circleId}                   # Detalhes do círculo
PATCH /circles/{circleId}                 # Editar círculo
DELETE /circles/{circleId}                # Deletar círculo
POST /circles/{circleId}/members          # Listar membros
PATCH /circles/{circleId}/members/{memberId} # Atualizar papel
DELETE /circles/{circleId}/members/{memberId} # Remover membro
POST /circles/{circleId}/leave            # Sair do círculo
```

### Invitations
```http
POST /circles/{circleId}/invitations      # Convidar por e-mail/telefone
GET /circles/{circleId}/invitations       # Listar pendentes
POST /invitations/{token}/accept          # Aceitar convite
DELETE /invitations/{token}               # Recusar/deletar
```

### Calendar
```http
GET /circles/{circleId}/events            # Listar eventos
POST /circles/{circleId}/events           # Criar evento
GET /events/{eventId}                     # Detalhes
PATCH /events/{eventId}                   # Editar
DELETE /events/{eventId}                  # Deletar
POST /events/{eventId}/participants       # Adicionar participante
PATCH /events/{eventId}/participants/{userId} # Atualizar status
DELETE /events/{eventId}/participants/{userId} # Remover
POST /events/{eventId}/comments           # Adicionar comentário
GET /events/{eventId}/comments            # Listar comentários
DELETE /events/{eventId}/comments/{commentId}
POST /calendar/google/authorize           # OAuth Google
POST /calendar/outlook/authorize          # OAuth Outlook
GET /calendar/google/sync                 # Sincronizar Google
```

### Tasks
```http
GET /circles/{circleId}/tasks             # Listar tarefas
POST /circles/{circleId}/tasks            # Criar
GET /tasks/{taskId}                       # Detalhes
PATCH /tasks/{taskId}                     # Editar
DELETE /tasks/{taskId}                    # Deletar
PATCH /tasks/{taskId}/status              # Atualizar status
POST /tasks/{taskId}/checklists           # Adicionar sub-tarefa
PATCH /tasks/{taskId}/checklists/{itemId} # Marcar sub-tarefa
```

### Shopping Lists (novo endpoint)
```http
GET /circles/{circleId}/lists             # Listar listas
POST /circles/{circleId}/lists            # Criar lista
GET /lists/{listId}                       # Detalhes
PATCH /lists/{listId}                     # Editar
DELETE /lists/{listId}                    # Deletar
POST /lists/{listId}/items                # Adicionar item
PATCH /lists/{listId}/items/{itemId}      # Atualizar/marcar
DELETE /lists/{listId}/items/{itemId}     # Deletar
POST /lists/{listId}/sync                 # Sincronizar (offline)
```

### Messages
```http
GET /circles/{circleId}/messages          # Listar mensagens gerais
POST /circles/{circleId}/messages         # Enviar mensagem
GET /threads/{threadType}/{threadId}/messages # Threads (evento, tarefa, etc)
POST /threads/{threadType}/{threadId}/messages # Enviar em thread
PATCH /messages/{messageId}               # Editar
DELETE /messages/{messageId}              # Deletar
POST /messages/{messageId}/reactions      # Adicionar reação
DELETE /messages/{messageId}/reactions/{emoji} # Remover reação
WS /ws/circles/{circleId}                 # WebSocket realtime
```

### Location
```http
POST /circles/{circleId}/location         # Enviar localização atual
GET /circles/{circleId}/locations/latest  # Última localização de cada membro
GET /circles/{circleId}/locations/history # Histórico de localização
POST /circles/{circleId}/places           # Criar local monitorado
GET /circles/{circleId}/places            # Listar locais
PATCH /places/{placeId}                   # Editar
DELETE /places/{placeId}                  # Deletar
GET /circles/{circleId}/place-events      # Histórico de chegadas/saídas
PATCH /circles/{circleId}/location-sharing/{userId} # Ativar/desativar
```

### Documents
```http
POST /documents/presigned-upload          # Obter URL assinada S3
POST /documents/complete-upload           # Finalizar upload
GET /circles/{circleId}/documents         # Listar documentos
POST /circles/{circleId}/documents        # Criar documento
GET /documents/{documentId}               # Detalhes
DELETE /documents/{documentId}            # Deletar
PATCH /documents/{documentId}             # Editar metadata
GET /documents/{documentId}/download-url  # URL assinada de download
```

### Recipes & Meal Plans
```http
GET /circles/{circleId}/recipes           # Listar receitas
POST /circles/{circleId}/recipes          # Criar/importar receita
GET /recipes/{recipeId}                   # Detalhes
DELETE /recipes/{recipeId}                # Deletar
PATCH /recipes/{recipeId}/favorite        # Marcar favorita
GET /circles/{circleId}/meal-plans        # Plano semanal
POST /circles/{circleId}/meal-plans       # Adicionar refeição
DELETE /meal-plans/{mealPlanId}           # Remover refeição
POST /meal-plans/{mealPlanId}/generate-shopping-list # Gerar lista de compras
```

### Budget
```http
GET /circles/{circleId}/budget-categories # Listar categorias
POST /circles/{circleId}/budget-categories # Criar categoria
PATCH /budget-categories/{categoryId}     # Editar
DELETE /budget-categories/{categoryId}    # Deletar
GET /circles/{circleId}/transactions      # Listar transações
POST /circles/{circleId}/transactions     # Criar transação
PATCH /transactions/{transactionId}       # Editar
DELETE /transactions/{transactionId}      # Deletar
GET /circles/{circleId}/budget/summary    # Resumo de orçamento
GET /circles/{circleId}/budget/by-member  # Gasto por membro
```

### Billing
```http
POST /billing/checkout                    # Iniciar checkout Stripe
POST /billing/portal                      # Portal de gerenciamento Stripe
GET /circles/{circleId}/subscription      # Status da assinatura
POST /webhooks/stripe                     # Webhook Stripe (pagamento)
POST /webhooks/apple                      # Webhook Apple (IAP)
POST /webhooks/google-play                # Webhook Google Play (IAP)
```

## 7. Realtime e Sincronização Offline

### Estratégia Client-Server

**No cliente (React):**
```typescript
// Local DB (IndexedDB)
localDB.save('purchases', purchase)

// Fila de sincronização
outbox.add({
  operation: 'create',
  entity: 'purchase',
  data: purchase,
  clientOperationId: generateId()
})

// Tenta sincronizar
sync.push()
  .catch(e => /* continua offline */)

// Recebe patches do servidor via WebSocket
ws.on('event:created', (event) => {
  localDB.update('events', event)
  ui.refresh()
})
```

**No servidor:**
```typescript
// Cada entidade tem:
- id (UUID)
- version (integer)
- updated_at (timestamp)
- updated_by (user_id)
- deleted_at (timestamp) -- soft delete

// Resolver conflito
POST /lists/{listId}/sync
Body: {
  items: [
    {
      clientOperationId,
      id,
      version,
      data,
      timestamp
    }
  ]
}

Response: {
  items: [
    {
      clientOperationId,
      id,
      version: 2,
      data,
      timestamp,
      conflict: false
    }
  ],
  serverChanges: [
    // outras mudanças que outras pessoas fizeram
  ]
}
```

### WebSocket Events

```typescript
// Realtime events via WebSocket
connection.on('event:created', (event) => {})
connection.on('event:updated', (event) => {})
connection.on('task:created', (task) => {})
connection.on('task:updated', (task) => {})
connection.on('message:sent', (message) => {})
connection.on('list-item:checked', (item) => {})
connection.on('user:online', (userId) => {})
connection.on('user:offline', (userId) => {})
connection.on('location:updated', (location) => {})
connection.on('place:event', (event) => {}) // arrival/departure
```

## 8. Notificações

### Tipos e Triggers

| Tipo | Trigger | Canais |
|------|---------|---------|
| event_reminder | 15/30/60 min antes do evento | push, email |
| event_updated | Evento compartilhado foi editado | push |
| task_assigned | Tarefa atribuída para você | push, email |
| task_due_soon | Tarefa vence em 24h | push |
| task_completed | Tarefa marcada como completa | push |
| item_added | Alguém adicionou à lista compartilhada | push |
| item_checked | Alguém marcou item que você adicionou | push |
| message_received | Mensagem nova no círculo | push |
| document_expiring | Documento vence em 7 dias | email |
| arrival | Pessoa chegou em safe zone | push |
| departure | Pessoa saiu de safe zone | push |
| budget_exceeded | Categoria atingiu limite | push, email |
| subscription_renewing | Renovação em 7 dias | email |
| subscription_failed | Pagamento falhou | email, SMS |

### Implementação

```
Backend Event → Workers (Celery/Arq)
  ↓
Check preferences (user.notification_preferences)
  ↓
Schedule time (não notificar meia-noite)
  ↓
Send via Channel:
  - FCM (Android)
  - APNs (iOS)
  - Web Push (PWA)
  - Email (SMTP)
  - SMS (Twilio - opcional)
  ↓
Log delivery (notification_logs)
  ↓
Retry on failure (exponential backoff)
```

## 9. Fases de Implementação

### Phase 1: Fundação + MVP Compras Compartilhadas (8 semanas)

**Objetivo:** Expandir Markt de compras individuais para familiares

**Trabalho:**
1. Criar schema de círculos, membros, invitações
2. Refatorar autenticação (permitir múltiplos círculos)
3. Adaptar Purchase/Product para ser compartilhado
4. Sistema de convites por e-mail
5. Permissões básicas (owner, admin, member)
6. UI de seletor de círculo
7. UI de gerenciamento de membros

**Não fazer ainda:**
- Calendário, tarefas, chat
- Localização, documentos
- Assinatura premium

**Métricas de sucesso:**
- Usuário cria círculo
- Convida outro usuário com sucesso
- Ambos veem lista de compras compartilhada em tempo real

---

### Phase 2: Calendário + Tarefas + Chat Básico (10 semanas)

**Objetivo:** Tornar Markt um hub familiar completo

**Trabalho:**
1. Calendário compartilhado (criação, edição, recorrência)
2. Tarefas com atribuição
3. Chat por círculo com threads
4. Push notifications básicas
5. Comentários em eventos/tarefas
6. Google Calendar sync (read-only para começar)

**Não fazer ainda:**
- Localização
- Documentos
- Meal planner
- Budget

**Métricas de sucesso:**
- Family cria evento no calendário
- Todos veem em tempo real
- Tarefas são atribuídas e completadas
- Chat funciona com notificações

---

### Phase 3: Offline-First + Sync Confiável (6 semanas)

**Objetivo:** Funcionar bem offline (mercado sem internet)

**Trabalho:**
1. IndexedDB no frontend
2. Outbox local com retry
3. Conflict resolution engine
4. Versioning em todas as entidades
5. Sync endpoint robusto
6. Tests de concorrência
7. Monitoring de sync failures

**Não fazer:**
- Features new, apenas polir o existente

**Métricas de sucesso:**
- Adicionar item offline, enviar quando online
- Dois usuários editam simultaneamente, sem conflito
- Sync failure rate < 0.1%

---

### Phase 4: Assinatura Premium (6 semanas)

**Objetivo:** Monetizar o produto

**Trabalho:**
1. Billing service (Stripe integration)
2. Feature flags por plan
3. Webhooks Stripe
4. Cancelamento/upgrade
5. Histórico de compras ilimitado
6. Storage limits enforcement
7. Premium UI/UX

**Features liberadas:**
- Documento compartilhado
- Meal planner
- Budget tracker
- Google Calendar write sync
- Localização em tempo real
- Timetables

**Métricas de sucesso:**
- Usuário faz upgrade
- Feature gate funciona
- Webhook de pagamento confiável

---

### Phase 5: Localização + Documentos (8 semanas)

**Objetivo:** Recursos premium avançados

**Trabalho:**
1. Localização em background (Capacitor)
2. Safe zones/geofences
3. Histórico de localização
4. Place events (arrival/departure)
5. Document management (upload, storage)
6. S3 integration
7. Virus scanning

**Não fazer:**
- Criptografia de documentos (future)
- Documentos públicos

**Métricas de sucesso:**
- Família compartilha localização
- Alerta de chegada/saída funciona
- Documentos armazenam e baixam corretamente

---

### Phase 6: Meal Planner + Budget (6 semanas)

**Objetivo:** Complementar gestão financeira familiar

**Trabalho:**
1. Receita CRUD
2. Meal plan semanal
3. Gerar lista de compras de receita
4. Budget categories
5. Transaction logging
6. Budget reports

**Métricas de sucesso:**
- Família planeja refeição
- Lista de compras gerada automaticamente
- Orçamento rastreado

---

### Phase 7: Diferenciais + IA (10 semanas)

**Opcional — adiciona valor:**
1. Extrair eventos de foto de calendário escolar (OCR + LLM)
2. Extrair ingredientes de receita (LLM)
3. Sugerir economias baseado no histórico (análise)
4. Detecção de anomalias de preço (ML)
5. Modo cuidador (babá, avó, motorista escolar)
6. Timeline familiar (feed de tudo que mudou)
7. Auditoria simples ("quem editou isso?")

---

## 10. Stack Técnico — Revisado

### Backend
- **Runtime:** Node.js 20+ (LTS)
- **Framework:** Express.js
- **ORM:** Prisma
- **Language:** TypeScript
- **Database:** PostgreSQL 15+
- **Cache:** Redis
- **Queue:** Bull (Redis-backed) ou Celery (se Python)
- **Auth:** JWT + refresh tokens + MFA opcional
- **Storage:** S3-compatible (AWS S3, Backblaze, ou Minio local)
- **Realtime:** WebSocket (ws library) + Redis Pub/Sub
- **Payments:** Stripe SDK
- **Notifications:** FCM (Firebase Cloud Messaging), APNs, Web Push
- **Email:** Nodemailer + SendGrid ou AWS SES
- **Logging:** Winston ou Pino
- **Monitoring:** Sentry, DataDog (opcional)

### Frontend Web
- **Framework:** React 19+
- **Bundler:** Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State:** TanStack Query (data) + Zustand (UI state)
- **Storage:** IndexedDB (offline)
- **Sync:** Custom offline-first engine
- **PWA:** vite-plugin-pwa
- **Maps:** Leaflet (já está no projeto)
- **Barcode:** @zxing/library (já está)
- **Charts:** Recharts (já está)
- **Router:** React Router v7

### Frontend Mobile
- **Framework:** React Native via Expo
- **Language:** TypeScript
- **Storage:** SQLite (via expo-sqlite)
- **Background:** expo-background-fetch, expo-location
- **Notifications:** expo-notifications
- **Barcode:** expo-barcode-scanner
- **Camera:** expo-camera
- **Maps:** react-native-maps ou expo-maps
- **Build:** EAS Build + Expo Router

### DevOps
- **Containerization:** Docker + Docker Compose
- **CI/CD:** GitHub Actions
- **Infrastructure:** Docker Compose (dev), Fly.io ou Railway (staging), AWS/GCP (prod)
- **CDN:** Cloudflare
- **DNS:** Cloudflare ou Route53
- **Database:** Managed PostgreSQL (RDS, Neon, Supabase)
- **IaC:** Terraform (optional, começar manual)

---

## 11. Segurança e Privacidade

### Obrigatório
- ✅ TLS/HTTPS em tudo
- ✅ Senhas: Argon2id (bcryptjs.hashSync com 12 rounds no mínimo)
- ✅ JWT: access token 15 min + refresh token 7 dias (rotacionado)
- ✅ RBAC por círculo (owner → admin → adult → child → guest)
- ✅ Rate limiting (auth: 5/min, invite: 10/h, upload: 100MB/day)
- ✅ URLs de mídia assinadas (S3 presigned, expiração 1h)
- ✅ Audit logs (quem editou o quê e quando)
- ✅ Consentimento explícito para localização
- ✅ Soft deletes (deleted_at) para recuperação
- ✅ GDPR: export de dados, deletar conta
- ✅ Validação de entrada (Zod)
- ✅ Proteção CSRF (tokens)
- ✅ MFA opcional (TOTP)

### Futuro (não MVP)
- Criptografia de documentos sensíveis (E2E)
- Backup automático
- Integração com Vault para secrets

---

## 12. Métricas de Produto

### Ativação
- **Activation**: usuário criou círculo + convidou 1+ membro + criou 1 evento/lista em 24h
- **Invite accept rate**: % de convites aceitos em 7 dias

### Engajamento
- **Weekly active circles**: % de círculos com ≥1 ação/semana
- **Events created/circle/week**
- **List items checked/circle/week**
- **Message count/circle/week**
- **Push notification open rate**

### Monetização
- **Free → paid conversion**: % após 14 dias de trial
- **Premium churn**: % que cancela em 30 dias
- **ARPPU**: revenue per premium user

### Confiabilidade
- **Sync failure rate**: < 0.1%
- **Push delivery rate**: > 99%
- **API uptime**: > 99.9%
- **Notification delivery latency**: < 5 segundos

---

## 13. Configuração de Projeto

### Estrutura de Pastas (Backend)

```
backend/
├── src/
│   ├── index.ts                 # Entry point
│   ├── config/
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   ├── env.ts
│   │   └── constants.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   ├── rateLimit.ts
│   │   └── cors.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── users.routes.ts
│   │   ├── circles.routes.ts
│   │   ├── invitations.routes.ts
│   │   ├── purchases.routes.ts
│   │   ├── events.routes.ts
│   │   ├── tasks.routes.ts
│   │   ├── lists.routes.ts
│   │   ├── messages.routes.ts
│   │   ├── locations.routes.ts
│   │   ├── documents.routes.ts
│   │   ├── recipes.routes.ts
│   │   ├── budget.routes.ts
│   │   └── billing.routes.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── circle.service.ts
│   │   ├── purchase.service.ts
│   │   ├── event.service.ts
│   │   ├── task.service.ts
│   │   ├── list.service.ts
│   │   ├── message.service.ts
│   │   ├── notification.service.ts
│   │   ├── location.service.ts
│   │   ├── document.service.ts
│   │   ├── sync.service.ts
│   │   ├── billing.service.ts
│   │   └── integration.service.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── circle.controller.ts
│   │   ├── event.controller.ts
│   │   ├── task.controller.ts
│   │   ├── purchase.controller.ts
│   │   └── ... (espelha services)
│   ├── models/
│   │   └── types.ts             # TypeScript interfaces
│   ├── utils/
│   │   ├── jwt.ts
│   │   ├── hash.ts
│   │   ├── validation.ts
│   │   ├── errors.ts
│   │   ├── s3.ts
│   │   ├── mail.ts
│   │   ├── push.ts
│   │   └── logger.ts
│   ├── workers/
│   │   ├── reminders.ts
│   │   ├── notifications.ts
│   │   ├── sync.ts
│   │   ├── billing.ts
│   │   └── integrations.ts
│   └── websocket/
│       ├── handlers.ts
│       ├── middleware.ts
│       └── events.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── .env.example
├── .dockerignore
├── Dockerfile
├── docker-compose.yml
├── tsconfig.json
└── package.json
```

### .env.example

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/markt

# Redis
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=your-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
JWT_EXPIRES_IN=900 # 15 min

# Storage
AWS_S3_REGION=us-east-1
AWS_S3_BUCKET=markt-storage
AWS_S3_ACCESS_KEY=xxx
AWS_S3_SECRET_KEY=xxx

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxx
EMAIL_FROM=noreply@markt.app

# Push Notifications
FCM_SERVER_KEY=xxx
APNS_KEY_ID=xxx
APNS_TEAM_ID=xxx
APNS_BUNDLE_ID=com.markt.app

# Payments
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Integrations
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
MICROSOFT_CLIENT_ID=xxx
MICROSOFT_CLIENT_SECRET=xxx
OPEN_FOOD_FACTS_API=https://world.openfoodfacts.org/api/v0

# Server
PORT=4000
NODE_ENV=development
LOG_LEVEL=info
```

---

## 14. Roadmap Executivo (12-18 meses)

| Mês | Phase | Entrega | Usuários Alvo |
|-----|-------|---------|---------------|
| M1-M2 | 1 | MVP listas compartilhadas | Famílias com 2+ pessoas |
| M3-M4 | 2 | Calendário + tarefas + chat | Famílias organizadas |
| M5-M6 | 3 | Sync offline + confiabilidade | Usuários com internet ruim |
| M7-M8 | 4 | Assinatura premium | Primeiros pagos |
| M9-M10 | 5 | Localização + documentos | Pais com filhos |
| M11-M12 | 6 | Meal planner + budget | Planejadores familiares |
| M13+ | 7 | Diferenciais de IA | Premium + engagement |

---

## 15. Riscos Técnicos

| Risco | Impacto | Mitigation |
|-------|---------|-----------|
| Sync offline falha | Alto | Versionamento + testes de concorrência |
| Push notification inconsistente | Alto | Device token validation + fallback email |
| Localização em background drena bateria | Médio | Throttling + stop quando parado |
| Privacidade infantil (regulatória) | Alto | Consentimento explícito + parental controls |
| Escalabilidade de WebSocket | Médio | Redis Pub/Sub fan-out |
| Importação Google Calendar bug | Médio | Webhook de sincronização com retry |
| Dados inconsistentes entre usuários | Alto | ACID transactions + audit logs |

---

## 16. Checklist de MVP 1

- [ ] Schema Circle, CircleMember, Invitation criado
- [ ] Endpoint POST /circles (criar)
- [ ] Endpoint POST /circles/{id}/invitations (convidar)
- [ ] Endpoint POST /invitations/{token}/accept (aceitar)
- [ ] Auth refatorada para multi-circle
- [ ] Purchase adaptada para compartilhamento
- [ ] UI de seletor de círculo
- [ ] UI de gerenciar membros
- [ ] Testes unitários de sync
- [ ] Deploy em staging
- [ ] Beta com 3 famílias
- [ ] Feedback loop + iteração
- [ ] Deploy produção

---

## 17. Como Começar

### Immediate (Esta semana)
1. Revisar schema atual do Markt
2. Planejar migrate strategy (PostgreSQL já está)
3. Configurar nova branch `feature/family-circles`
4. Criar schema de Circle, CircleMember, Invitation

### Week 2-3
1. Implementar Circle CRUD
2. Implementar sistema de convites
3. Refatorar auth para suportar multi-circle
4. Adaptar Purchase para usar circle_id

### Week 4-6
1. UI em React para seletor de círculo
2. UI para gerenciar membros
3. WebSocket básico para sync
4. Testes de integração

### Week 7-8
1. Deploy em staging
2. Beta testing com amigos/família
3. Feedback + ajustes
4. Deploy produção

---

## 18. Conclusão

O Markt tem potencial de evoluir de um **app focado em compras individuais** para uma **plataforma integrada de organização familiar**.

**Diferenciadores:**
- Começa simples (listas compartilhadas)
- Expande conforme demanda (calendário → tarefas → chat)
- Usa histórico de compras para insights (economia, hábitos)
- Integração com Google Calendar/Outlook (premium)
- Não é clone exato do FamilyWall — é Markt + organização familiar

**Chave do sucesso:**
1. **MVP bem focado** — não tente fazer tudo. Listas compartilhadas + convites.
2. **Sync confiável** — offline-first é essencial.
3. **Notificações robustas** — senão membros não voltam.
4. **Segurança desde o dia 1** — dados familiares são sensíveis.
5. **UX extremamente simples** — a família não é tech-savvy.

**Próximos passos:**
1. Acordar roadmap com time
2. Criar branch e começar schema
3. Implementar MVP de círculos
4. Testar com beta group
5. Iterar baseado em feedback

---

**Documento criado em:** 2026-07-03  
**Última atualização:** 2026-07-03  
**Status:** Pronto para implementação  
**Responsável:** Arquitetura de Produto
