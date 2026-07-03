# Arquitetura Técnica — Markt Familiar

Referência técnica para implementação do Markt Familiar com foco em offline-first, sync confiável e escalabilidade.

## 1. Estrutura de Pastas

### Backend

```
backend/
├── src/
│   ├── index.ts                 # Entry, Express setup, WebSocket
│   ├── config/
│   │   ├── database.ts          # Prisma client
│   │   ├── redis.ts             # Redis client + Pub/Sub
│   │   ├── s3.ts                # AWS S3 client
│   │   ├── mail.ts              # SMTP config
│   │   ├── stripe.ts            # Stripe config
│   │   ├── env.ts               # Validação de env vars
│   │   └── constants.ts         # Constantes globais
│   ├── middleware/
│   │   ├── auth.ts              # JWT + multi-circle
│   │   ├── errorHandler.ts      # Global error handler
│   │   ├── rateLimit.ts         # IP-based rate limit
│   │   └── validation.ts        # Zod schemas
│   ├── routes/
│   │   ├── index.ts
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
│   │   ├── circle.service.ts
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── purchase.service.ts
│   │   ├── event.service.ts
│   │   ├── task.service.ts
│   │   ├── list.service.ts
│   │   ├── sync.service.ts (offline-first)
│   │   ├── notification.service.ts
│   │   ├── location.service.ts
│   │   ├── document.service.ts
│   │   ├── billing.service.ts
│   │   └── integration.service.ts (Google, Outlook)
│   ├── controllers/
│   │   └── (espelha services)
│   ├── models/
│   │   └── types.ts
│   ├── utils/
│   │   ├── jwt.ts
│   │   ├── hash.ts
│   │   ├── logger.ts
│   │   ├── errors.ts
│   │   ├── validators.ts
│   │   ├── s3.ts
│   │   ├── mail.ts
│   │   └── push.ts
│   ├── workers/
│   │   ├── reminders.ts         # Celery/Bull: event reminders
│   │   ├── notifications.ts     # Push + email
│   │   ├── billing.ts           # Renewal + dunning
│   │   ├── sync.ts              # Google Calendar sync
│   │   └── integrations.ts
│   ├── websocket/
│   │   ├── handlers.ts
│   │   ├── middleware.ts
│   │   └── events.ts
│   └── __tests__/
│       ├── unit/
│       ├── integration/
│       └── fixtures/
├── prisma/
│   ├── schema.prisma            # Database schema
│   ├── migrations/              # Prisma migrations
│   └── seed.ts
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── .eslintrc.json
├── tsconfig.json
└── package.json
```

### Frontend Web

```
frontend/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Circles.tsx          # Seletor e gerenciador
│   │   ├── Purchases.tsx        # Módulo de compras
│   │   ├── Calendar.tsx         # Módulo calendário
│   │   ├── Tasks.tsx            # Módulo tarefas
│   │   ├── Chat.tsx             # Módulo chat
│   │   ├── Location.tsx         # Mapa + localização
│   │   ├── Documents.tsx        # Documentos
│   │   ├── Recipes.tsx          # Receitas
│   │   ├── Budget.tsx           # Orçamento
│   │   └── Settings.tsx
│   ├── components/
│   │   ├── Navigation/
│   │   ├── CircleSelector/
│   │   ├── CircleMembers/
│   │   ├── CalendarView/
│   │   ├── EventForm/
│   │   ├── TaskCard/
│   │   ├── ListItem/
│   │   ├── MessageBubble/
│   │   └── ...
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useCircle.ts
│   │   ├── useOfflineSync.ts    # Offline-first
│   │   ├── useWebSocket.ts
│   │   ├── useLocalDB.ts        # IndexedDB
│   │   └── useNotifications.ts
│   ├── services/
│   │   ├── api.ts               # Axios instance
│   │   ├── localDB.ts           # IndexedDB wrapper
│   │   ├── sync.ts              # Sync engine
│   │   ├── websocket.ts
│   │   ├── notifications.ts
│   │   └── offline.ts
│   ├── stores/
│   │   ├── auth.store.ts        # Zustand
│   │   ├── circle.store.ts
│   │   ├── purchases.store.ts
│   │   ├── events.store.ts
│   │   ├── tasks.store.ts
│   │   ├── messages.store.ts
│   │   └── offline.store.ts
│   ├── utils/
│   │   ├── constants.ts
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── helpers.ts
│   ├── styles/
│   │   └── globals.css
│   └── types/
│       └── index.ts
├── public/
│   ├── manifest.json
│   ├── icons/
│   └── favicon.ico
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 2. Implementação: Auth Multi-Circle

### Backend: types.ts

```typescript
// src/models/types.ts

export interface JWTPayload {
  userId: string;
  circleId: string;      // Qual círculo está usando agora
  role: 'owner' | 'admin' | 'adult' | 'child' | 'guest';
  email: string;
  iat: number;
  exp: number;
}

export interface User {
  id: string;
  cpf: string;
  email: string;
  name: string;
  passwordHash: string;
  avatar_url?: string;
  locale: string;
  timezone: string;
  notification_preferences: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Circle {
  id: string;
  name: string;
  owner_id: string;
  description?: string;
  avatar_url?: string;
  plan: 'free' | 'premium';
  storage_limit_bytes: number;
  created_at: Date;
}

export interface CircleMember {
  id: string;
  circle_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'adult' | 'child' | 'guest';
  color: string;
  nickname?: string;
  location_sharing_enabled: boolean;
  joined_at: Date;
  left_at?: Date;
}
```

### Backend: auth.service.ts

```typescript
// src/services/auth.service.ts

import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AuthService {
  async register(cpf: string, email: string, name: string, password: string) {
    // Validar CPF (implementar)
    const existingUser = await prisma.user.findUnique({ where: { cpf } });
    if (existingUser) throw new Error('User already exists');

    const passwordHash = await bcryptjs.hash(password, 12);
    
    const user = await prisma.user.create({
      data: {
        cpf,
        email,
        name,
        passwordHash,
        locale: 'pt-BR',
        timezone: 'America/Sao_Paulo'
      }
    });

    return { userId: user.id, email: user.email };
  }

  async login(cpf: string, password: string, circleId?: string) {
    const user = await prisma.user.findUnique({ where: { cpf } });
    if (!user) throw new Error('Invalid credentials');

    const validPassword = await bcryptjs.compare(password, user.passwordHash);
    if (!validPassword) throw new Error('Invalid credentials');

    // Se circleId não fornecido, usa o primeiro círculo do usuário
    let circle;
    if (!circleId) {
      circle = await prisma.circleMember.findFirst({
        where: { user_id: user.id },
        include: { circle: true }
      });
      if (!circle) throw new Error('No circles found');
    } else {
      // Verificar se usuário tem permissão nesse círculo
      circle = await prisma.circleMember.findUnique({
        where: {
          circle_id_user_id: { circle_id: circleId, user_id: user.id }
        },
        include: { circle: true }
      });
      if (!circle) throw new Error('Access denied');
    }

    const accessToken = this.generateAccessToken(user.id, circle.circle_id, circle.role, user.email);
    const refreshToken = this.generateRefreshToken(user.id);

    // Salvar refresh token (hash) no BD
    await prisma.refreshToken.create({
      data: {
        user_id: user.id,
        token_hash: await bcryptjs.hash(refreshToken, 10),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        cpf: user.cpf,
        email: user.email,
        name: user.name,
        circle: {
          id: circle.circle_id,
          name: circle.circle.name,
          role: circle.role
        }
      }
    };
  }

  async refresh(userId: string, refreshToken: string) {
    // Validar refresh token do BD
    // Gerar novo access token
    const accessToken = this.generateAccessToken(
      userId,
      'circle_id', // pegar do BD
      'adult',     // pegar do BD
      'email'      // pegar do BD
    );
    return { accessToken };
  }

  private generateAccessToken(userId: string, circleId: string, role: string, email: string) {
    return jwt.sign(
      { userId, circleId, role, email },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );
  }

  private generateRefreshToken(userId: string) {
    return jwt.sign(
      { userId },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    );
  }
}
```

### Backend: auth.middleware.ts

```typescript
// src/middleware/auth.ts

import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      userId: string;
      circleId: string;
      role: string;
      email: string;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.userId = decoded.userId;
    req.circleId = decoded.circleId;
    req.role = decoded.role;
    req.email = decoded.email;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid token' });
  }
}

// Middleware para verificar permissão em círculo específico
export async function checkCircleAccess(req: Request, res: Response, next: NextFunction) {
  const { circleId } = req.params;
  if (circleId !== req.circleId) {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
}

// Middleware para verificar role mínimo
export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!allowedRoles.includes(req.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}
```

---

## 3. Implementação: Offline-First Sync

### Frontend: localDB.ts (IndexedDB wrapper)

```typescript
// src/services/localDB.ts

import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface MarktDB extends DBSchema {
  purchases: {
    key: string;
    value: {
      id: string;
      circleId: string;
      marketId: string;
      items: any[];
      status: 'open' | 'completed';
      totalAmount: number;
      createdAt: string;
      updatedAt: string;
      version: number;
    };
    indexes: { 'by-circle': string; 'by-status': string };
  };
  events: {
    key: string;
    value: any;
    indexes: { 'by-circle': string };
  };
  tasks: {
    key: string;
    value: any;
    indexes: { 'by-circle': string };
  };
  lists: {
    key: string;
    value: any;
    indexes: { 'by-circle': string };
  };
  outbox: {
    key: string;
    value: {
      id: string;
      operation: 'create' | 'update' | 'delete';
      entity: string;
      entityId: string;
      circleId: string;
      data: any;
      clientOperationId: string;
      timestamp: number;
      synced: boolean;
      syncAttempts: number;
    };
  };
}

class LocalDB {
  private db: IDBPDatabase<MarktDB> | null = null;

  async init() {
    this.db = await openDB<MarktDB>('markt', 1, {
      upgrade(db) {
        // Purchases
        if (!db.objectStoreNames.contains('purchases')) {
          const purchaseStore = db.createObjectStore('purchases', { keyPath: 'id' });
          purchaseStore.createIndex('by-circle', 'circleId');
          purchaseStore.createIndex('by-status', 'status');
        }

        // Events
        if (!db.objectStoreNames.contains('events')) {
          const eventStore = db.createObjectStore('events', { keyPath: 'id' });
          eventStore.createIndex('by-circle', 'circleId');
        }

        // Tasks
        if (!db.objectStoreNames.contains('tasks')) {
          const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
          taskStore.createIndex('by-circle', 'circleId');
        }

        // Lists
        if (!db.objectStoreNames.contains('lists')) {
          const listStore = db.createObjectStore('lists', { keyPath: 'id' });
          listStore.createIndex('by-circle', 'circleId');
        }

        // Outbox (fila de sincronização)
        if (!db.objectStoreNames.contains('outbox')) {
          db.createObjectStore('outbox', { keyPath: 'id' });
        }
      }
    });
  }

  async getByCircle(store: string, circleId: string) {
    if (!this.db) throw new Error('DB not initialized');
    return this.db.getAllFromIndex(store as any, 'by-circle', circleId);
  }

  async get(store: string, key: string) {
    if (!this.db) throw new Error('DB not initialized');
    return this.db.get(store as any, key);
  }

  async put(store: string, value: any) {
    if (!this.db) throw new Error('DB not initialized');
    return this.db.put(store as any, value);
  }

  async delete(store: string, key: string) {
    if (!this.db) throw new Error('DB not initialized');
    return this.db.delete(store as any, key);
  }

  // Operações em outbox
  async addToOutbox(operation: string, entity: string, entityId: string, circleId: string, data: any) {
    if (!this.db) throw new Error('DB not initialized');

    const clientOperationId = `${Date.now()}-${Math.random()}`;
    await this.db.add('outbox', {
      id: clientOperationId,
      operation,
      entity,
      entityId,
      circleId,
      data,
      clientOperationId,
      timestamp: Date.now(),
      synced: false,
      syncAttempts: 0
    });

    return clientOperationId;
  }

  async getPendingOutbox() {
    if (!this.db) throw new Error('DB not initialized');
    const allOutbox = await this.db.getAll('outbox');
    return allOutbox.filter(item => !item.synced && item.syncAttempts < 5);
  }

  async markSynced(clientOperationId: string) {
    if (!this.db) throw new Error('DB not initialized');
    const item = await this.db.get('outbox', clientOperationId);
    if (item) {
      item.synced = true;
      await this.db.put('outbox', item);
    }
  }
}

export const localDB = new LocalDB();
```

### Frontend: sync.ts (Sync Engine)

```typescript
// src/services/sync.ts

import { localDB } from './localDB';
import { api } from './api';

interface SyncItem {
  clientOperationId: string;
  entity: string;
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  data: any;
}

export class SyncEngine {
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;

  async init() {
    await localDB.init();
    this.startAutoSync();
  }

  private startAutoSync() {
    // Tentar sincronizar a cada 30s
    this.syncInterval = setInterval(() => {
      this.syncPending().catch(e => console.error('Sync error:', e));
    }, 30000);
  }

  async syncPending() {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      const pending = await localDB.getPendingOutbox();
      if (pending.length === 0) return;

      const circleId = pending[0].circleId; // Assume same circle
      const items: SyncItem[] = pending.map(p => ({
        clientOperationId: p.clientOperationId,
        entity: p.entity,
        entityId: p.entityId,
        operation: p.operation,
        data: p.data
      }));

      // Enviar para servidor
      const response = await api.post(`/circles/${circleId}/sync`, { items });

      // Processar respostas
      for (const result of response.data.items) {
        if (!result.conflict) {
          await localDB.markSynced(result.clientOperationId);

          // Atualizar local DB com versão do servidor
          const store = result.entity.toLowerCase() + 's';
          const updated = { ...result.data, version: result.version };
          await localDB.put(store, updated);
        } else {
          console.warn(`Conflict for ${result.clientOperationId}`);
          // Implementar merge strategy
        }
      }

      // Aplicar mudanças de outros usuários
      for (const change of response.data.serverChanges || []) {
        const store = change.entity.toLowerCase() + 's';
        if (change.deleted) {
          await localDB.delete(store, change.id);
        } else {
          await localDB.put(store, change);
        }
      }
    } finally {
      this.isSyncing = false;
    }
  }

  async addChange(operation: 'create' | 'update' | 'delete', entity: string, entityId: string, circleId: string, data: any) {
    const clientOperationId = await localDB.addToOutbox(operation, entity, entityId, circleId, data);

    // Atualizar local DB imediatamente
    const store = entity.toLowerCase() + 's';
    if (operation !== 'delete') {
      await localDB.put(store, {
        id: entityId,
        circleId,
        ...data,
        version: data.version || 1
      });
    } else {
      await localDB.delete(store, entityId);
    }

    // Tentar sincronizar imediatamente
    this.syncPending().catch(console.error);

    return clientOperationId;
  }

  destroy() {
    if (this.syncInterval) clearInterval(this.syncInterval);
  }
}

export const syncEngine = new SyncEngine();
```

### Backend: sync.service.ts (Conflict Resolution)

```typescript
// src/services/sync.service.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SyncService {
  async syncBatch(circleId: string, userId: string, items: SyncItem[]) {
    const results = [];
    const serverChanges = [];

    for (const item of items) {
      try {
        const result = await this.processSyncItem(circleId, userId, item);
        results.push(result);
      } catch (error) {
        results.push({
          clientOperationId: item.clientOperationId,
          conflict: true,
          error: error.message
        });
      }
    }

    // Buscar mudanças de outros usuários na mesma entidade
    const otherChanges = await this.getOtherUserChanges(circleId, userId, items);
    serverChanges.push(...otherChanges);

    return { items: results, serverChanges };
  }

  private async processSyncItem(circleId: string, userId: string, item: SyncItem) {
    const table = this.getTableName(item.entity);

    if (item.operation === 'create') {
      const created = await prisma[table].create({
        data: {
          id: item.data.id,
          circle_id: circleId,
          created_by: userId,
          version: 1,
          updated_at: new Date(),
          ...item.data
        }
      });

      return {
        clientOperationId: item.clientOperationId,
        id: created.id,
        version: created.version,
        conflict: false,
        data: created
      };
    }

    if (item.operation === 'update') {
      const existing = await prisma[table].findUnique({
        where: { id: item.data.id }
      });

      if (!existing) throw new Error('Not found');

      // Last-write-wins: comparar versão
      if (existing.version !== item.data.clientVersion) {
        return {
          clientOperationId: item.clientOperationId,
          conflict: true,
          serverVersion: existing.version
        };
      }

      const updated = await prisma[table].update({
        where: { id: item.data.id },
        data: {
          ...item.data,
          version: existing.version + 1,
          updated_at: new Date(),
          updated_by: userId
        }
      });

      return {
        clientOperationId: item.clientOperationId,
        id: updated.id,
        version: updated.version,
        conflict: false,
        data: updated
      };
    }

    if (item.operation === 'delete') {
      // Soft delete
      const deleted = await prisma[table].update({
        where: { id: item.data.id },
        data: { deleted_at: new Date() }
      });

      return {
        clientOperationId: item.clientOperationId,
        conflict: false
      };
    }

    throw new Error('Invalid operation');
  }

  private async getOtherUserChanges(circleId: string, userId: string, items: SyncItem[]) {
    // Buscar mudanças nos mesmos tipos de entidades feitas por outros usuários
    // Retornar para o cliente aplicar
    return [];
  }

  private getTableName(entity: string): string {
    const map = {
      'purchase': 'purchase',
      'event': 'calendarEvent',
      'task': 'task',
      'list': 'sharedList',
      'listItem': 'sharedListItem'
    };
    return map[entity] || entity;
  }
}
```

---

## 4. Implementação: WebSocket Realtime

### Backend: websocket/handlers.ts

```typescript
// src/websocket/handlers.ts

import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const prisma = new PrismaClient();

export function setupWebSocketHandlers(io: Server) {
  io.use(authMiddleware);

  io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.data.userId}`);

    // Join circle room
    socket.on('join-circle', (circleId: string) => {
      socket.join(`circle:${circleId}`);
      console.log(`User ${socket.data.userId} joined circle ${circleId}`);
    });

    // Event handlers
    socket.on('event:create', async (data) => {
      const event = await prisma.calendarEvent.create({
        data: {
          circle_id: data.circleId,
          title: data.title,
          starts_at: new Date(data.startsAt),
          created_by_user_id: socket.data.userId,
          ...data
        }
      });

      io.to(`circle:${data.circleId}`).emit('event:created', event);
    });

    socket.on('event:update', async (data) => {
      const event = await prisma.calendarEvent.update({
        where: { id: data.id },
        data: {
          title: data.title,
          starts_at: new Date(data.startsAt),
          updated_at: new Date(),
          ...data
        }
      });

      io.to(`circle:${data.circleId}`).emit('event:updated', event);
    });

    // Task handlers
    socket.on('task:create', async (data) => {
      const task = await prisma.task.create({
        data: {
          circle_id: data.circleId,
          title: data.title,
          created_by_user_id: socket.data.userId,
          ...data
        }
      });

      io.to(`circle:${data.circleId}`).emit('task:created', task);
    });

    // List item handlers
    socket.on('list-item:check', async (data) => {
      const item = await prisma.sharedListItem.update({
        where: { id: data.itemId },
        data: {
          checked_by_user_id: socket.data.userId,
          checked_at: new Date()
        }
      });

      io.to(`circle:${data.circleId}`).emit('list-item:checked', item);
    });

    // Message handlers
    socket.on('message:send', async (data) => {
      const message = await prisma.message.create({
        data: {
          circle_id: data.circleId,
          thread_type: data.threadType || 'general',
          thread_id: data.threadId,
          sender_id: socket.data.userId,
          body: data.body
        }
      });

      io.to(`circle:${data.circleId}`).emit('message:sent', message);
    });

    // Location handler
    socket.on('location:update', async (data) => {
      const location = await prisma.location.create({
        data: {
          circle_id: data.circleId,
          user_id: socket.data.userId,
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: data.accuracy,
          address: data.address,
          captured_at: new Date()
        }
      });

      io.to(`circle:${data.circleId}`).emit('location:updated', location);

      // Check geofences
      const places = await prisma.place.findMany({
        where: { circle_id: data.circleId }
      });

      for (const place of places) {
        const distance = this.calculateDistance(
          data.latitude,
          data.longitude,
          place.latitude,
          place.longitude
        );

        if (distance < place.radius_meters) {
          // Usuário chegou no lugar
          await prisma.placeEvent.create({
            data: {
              place_id: place.id,
              user_id: socket.data.userId,
              event_type: 'arrival',
              occurred_at: new Date()
            }
          });

          io.to(`circle:${data.circleId}`).emit('place:arrival', {
            placeId: place.id,
            userId: socket.data.userId,
            placeName: place.name
          });
        }
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.data.userId}`);
    });
  });
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  // Haversine formula
  const R = 6371000; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
```

### Frontend: useWebSocket.ts Hook

```typescript
// src/hooks/useWebSocket.ts

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useCircleStore } from '../stores/circle.store';
import { useEventStore } from '../stores/events.store';
import { useTaskStore } from '../stores/tasks.store';

export function useWebSocket() {
  const socketRef = useRef<Socket | null>(null);
  const circleId = useCircleStore(s => s.currentCircleId);
  const { addEvent, updateEvent } = useEventStore();
  const { addTask, updateTask } = useTaskStore();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token || !circleId) return;

    socketRef.current = io(import.meta.env.VITE_API_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to WebSocket');
      socketRef.current?.emit('join-circle', circleId);
    });

    // Listen for events
    socketRef.current.on('event:created', (event) => {
      addEvent(event);
    });

    socketRef.current.on('event:updated', (event) => {
      updateEvent(event);
    });

    socketRef.current.on('task:created', (task) => {
      addTask(task);
    });

    socketRef.current.on('task:updated', (task) => {
      updateTask(task);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [circleId]);

  return socketRef.current;
}
```

---

## 5. Implementação: Notificações Push

### Backend: notification.service.ts

```typescript
// src/services/notification.service.ts

import { PrismaClient } from '@prisma/client';
import admin from 'firebase-admin';

const prisma = new PrismaClient();
admin.initializeApp();

export class NotificationService {
  async sendEventReminder(eventId: string) {
    const event = await prisma.calendarEvent.findUnique({
      where: { id: eventId },
      include: { eventParticipants: true }
    });

    if (!event) return;

    const now = new Date();
    const reminders = [15, 30, 60]; // minutos antes

    for (const minutes of reminders) {
      const reminderTime = new Date(event.starts_at.getTime() - minutes * 60 * 1000);
      
      if (now.getTime() >= reminderTime.getTime() && 
          now.getTime() < reminderTime.getTime() + 60000) {
        
        for (const participant of event.eventParticipants) {
          await this.sendPush(participant.user_id, {
            title: 'Lembrete de evento',
            body: `${event.title} em ${minutes} minutos`,
            data: { eventId: event.id, circleId: event.circle_id }
          });
        }
      }
    }
  }

  async sendTaskAssigned(taskId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!task || !task.assigned_to_user_id) return;

    const assignedUser = await prisma.user.findUnique({
      where: { id: task.assigned_to_user_id }
    });

    await this.sendPush(task.assigned_to_user_id, {
      title: 'Nova tarefa atribuída',
      body: task.title,
      data: { taskId: task.id, circleId: task.circle_id }
    });

    if (assignedUser?.email) {
      await this.sendEmail(assignedUser.email, {
        subject: 'Nova tarefa atribuída',
        body: `Você foi designado para: ${task.title}`
      });
    }
  }

  private async sendPush(userId: string, payload: { title: string; body: string; data: any }) {
    // Buscar dispositivos do usuário
    const devices = await prisma.deviceToken.findMany({
      where: { user_id: userId }
    });

    for (const device of devices) {
      try {
        await admin.messaging().send({
          token: device.token,
          notification: {
            title: payload.title,
            body: payload.body
          },
          data: Object.fromEntries(
            Object.entries(payload.data).map(([k, v]) => [k, String(v)])
          )
        });
      } catch (error) {
        console.error(`Failed to send push to ${device.id}:`, error);
        // Marcar como inválido se erro de auth
      }
    }
  }

  private async sendEmail(email: string, { subject, body }: { subject: string; body: string }) {
    // Implementar com Nodemailer ou SendGrid
  }
}
```

---

## 6. Docker Compose (local dev)

```yaml
# docker-compose.yml

version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: markt
      POSTGRES_PASSWORD: dev_password
      POSTGRES_DB: markt_dev
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U markt"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://markt:dev_password@postgres:5432/markt_dev
      REDIS_URL: redis://redis:6379
      JWT_SECRET: dev_secret_key_min_32_chars_long
      JWT_REFRESH_SECRET: dev_refresh_secret_key_min_32_chars
      NODE_ENV: development
    ports:
      - "4000:4000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./backend/src:/app/src
    command: npm run dev

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    ports:
      - "5173:5173"
    environment:
      VITE_API_URL: http://localhost:4000
    volumes:
      - ./frontend/src:/app/src
    command: npm run dev

volumes:
  postgres_data:
```

---

## 7. Checklist: MVP 1 (Círculos + Listas Compartilhadas)

- [ ] **Schema**
  - [ ] Tabelas: Circle, CircleMember, Invitation, SharedList, SharedListItem
  - [ ] Migrations criadas
  - [ ] Indexes para performance

- [ ] **Backend: Auth**
  - [ ] Register/login adaptar para multi-circle
  - [ ] JWT com circleId
  - [ ] Refresh token rotation
  - [ ] RBAC middleware

- [ ] **Backend: Circles**
  - [ ] POST /circles (criar)
  - [ ] GET /circles (listar)
  - [ ] PATCH /circles/{id} (editar)
  - [ ] DELETE /circles/{id} (deletar)
  - [ ] POST /circles/{id}/members (listar)
  - [ ] DELETE /circles/{id}/members/{memberId} (remover)

- [ ] **Backend: Invitations**
  - [ ] POST /circles/{id}/invitations (convidar)
  - [ ] POST /invitations/{token}/accept
  - [ ] Email de convite

- [ ] **Backend: Lists**
  - [ ] POST /circles/{id}/lists (criar)
  - [ ] GET /circles/{id}/lists (listar)
  - [ ] POST /lists/{id}/items (adicionar item)
  - [ ] PATCH /lists/{id}/items/{itemId} (marcar check)
  - [ ] POST /lists/{id}/sync (sync offline)

- [ ] **Frontend**
  - [ ] Página de seletor de círculo
  - [ ] Página criar círculo
  - [ ] Página convitar membros
  - [ ] Página listar membros
  - [ ] Integrar lista compartilhada no módulo de compras
  - [ ] LocalDB + sync engine
  - [ ] WebSocket join-circle

- [ ] **Testing**
  - [ ] Unit tests: auth, circle, list services
  - [ ] Integration tests: criação de círculo + convite + sync
  - [ ] E2E test: família cria lista e ambos veem atualizar

- [ ] **Deploy**
  - [ ] Staging environment
  - [ ] Beta com 5 famílias
  - [ ] Feedback + iteração
  - [ ] Production deploy

---

Este documento é uma base prática para iniciar a implementação. Adapte conforme necessário e sempre consulte o `PLANO_ORGANIZADOR_FAMILIAR.md` para contexto estratégico.
