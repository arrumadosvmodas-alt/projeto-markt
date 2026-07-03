import React, { useState } from 'react';
import { Card, Badge } from '../components/UI/index';

interface Circle {
  id: string;
  name: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'adult' | 'child';
  memberCount: number;
  lastActivity?: string;
}

interface DashboardItem {
  icon: string;
  label: string;
  value: string | number;
  color: 'primary' | 'green' | 'amber' | 'red';
}

export const CircleDashboard: React.FC = () => {
  const [selectedCircle, setSelectedCircle] = useState<Circle | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  // Mock data
  const circles: Circle[] = [
    {
      id: '1',
      name: 'Minha Família',
      role: 'owner',
      memberCount: 4,
      lastActivity: 'Há 2 min'
    },
    {
      id: '2',
      name: 'Amigos do Apartamento',
      role: 'admin',
      memberCount: 3,
      lastActivity: 'Há 1 hora'
    }
  ];

  const dashboardItems: DashboardItem[] = [
    { icon: '🛒', label: 'Listas Ativas', value: 3, color: 'primary' },
    { icon: '💰', label: 'Gasto Semana', value: 'R$ 287,50', color: 'amber' },
    { icon: '👥', label: 'Membros', value: 4, color: 'green' },
    { icon: '✓', label: 'Tarefas Pendentes', value: 7, color: 'red' }
  ];

  const current = selectedCircle || circles[0];
  setSelectedCircle(current);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* HEADER */}
      <header className="bg-gradient-primary text-white p-lg shadow-lg sticky top-0 z-fixed">
        <div className="flex items-center justify-between mb-lg">
          <h1 className="text-2xl font-bold">Markt</h1>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-all"
          >
            ⚙️
          </button>
        </div>

        {/* CIRCLE SELECTOR */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-full bg-white/10 hover:bg-white/20 text-white p-md rounded-lg transition-all text-left flex items-center justify-between"
          >
            <div className="flex items-center gap-md">
              <div className="w-12 h-12 bg-white/30 rounded-lg flex items-center justify-center text-xl">
                👨‍👩‍👧‍👦
              </div>
              <div>
                <p className="font-semibold">{current.name}</p>
                <small className="opacity-75">{current.memberCount} membros</small>
              </div>
            </div>
            <span className="text-xl">{showMenu ? '▲' : '▼'}</span>
          </button>

          {/* DROPDOWN */}
          {showMenu && (
            <div className="absolute top-full left-0 right-0 mt-sm bg-white rounded-lg shadow-xl overflow-hidden animate-slideUp z-dropdown">
              {circles.map((circle) => (
                <button
                  key={circle.id}
                  onClick={() => {
                    setSelectedCircle(circle);
                    setShowMenu(false);
                  }}
                  className={`w-full p-lg text-left flex items-center gap-md border-b last:border-b-0 hover:bg-gray-50 transition-colors ${
                    circle.id === current.id ? 'bg-indigo-50' : ''
                  }`}
                >
                  <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center text-white">
                    👨‍👩‍👧‍👦
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{circle.name}</p>
                    <small className="text-gray-500">{circle.memberCount} membros</small>
                  </div>
                  <Badge variant={circle.role === 'owner' ? 'primary' : 'success'}>
                    {circle.role === 'owner' ? '👑' : '✓'}
                  </Badge>
                </button>
              ))}
              <button className="w-full p-lg text-left text-indigo-600 font-semibold hover:bg-indigo-50 flex items-center gap-md">
                <span className="text-xl">➕</span>
                Novo Círculo
              </button>
            </div>
          )}
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="p-lg pb-24">
        {/* QUICK STATS */}
        <section className="grid grid-cols-2 gap-md mb-xl">
          {dashboardItems.map((item, idx) => (
            <Card key={idx} className="animate-slideUp">
              <div className="text-center">
                <div className="text-3xl mb-sm">{item.icon}</div>
                <small className="text-gray-600 block mb-sm">{item.label}</small>
                <p className="text-xl font-bold text-gray-900">{item.value}</p>
              </div>
            </Card>
          ))}
        </section>

        {/* ACTIVE LISTS */}
        <section className="mb-xl">
          <div className="flex items-center justify-between mb-lg">
            <h2 className="text-xl font-bold">Listas Compartilhadas</h2>
            <a href="#" className="text-indigo-600 text-sm font-semibold">
              Ver tudo →
            </a>
          </div>

          <div className="space-y-md">
            {[
              { name: 'Compras do Mês', items: 12, checked: 5, lastUpdate: 'Há 20 min' },
              { name: 'Supermercado', items: 8, checked: 3, lastUpdate: 'Há 1 hora' },
              { name: 'Farmácia', items: 4, checked: 0, lastUpdate: 'Há 3 horas' }
            ].map((list, idx) => (
              <Card key={idx} className="cursor-pointer hover:shadow-lg transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-xs">{list.name}</h3>
                    <div className="flex items-center gap-md">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-primary h-2 rounded-full transition-all"
                          style={{ width: `${(list.checked / list.items) * 100}%` }}
                        />
                      </div>
                      <small className="text-gray-500">
                        {list.checked}/{list.items}
                      </small>
                    </div>
                    <small className="text-gray-500 block mt-xs">{list.lastUpdate}</small>
                  </div>
                  <div className="text-2xl ml-md">→</div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* FAMILY ACTIVITY */}
        <section>
          <h2 className="text-xl font-bold mb-lg">Atividade da Família</h2>
          <div className="space-y-sm">
            {[
              { avatar: '👩', name: 'Maria', action: 'adicionou 3 itens', time: 'Há 20 min' },
              { avatar: '👨', name: 'João', action: 'completou lista', time: 'Há 1 hora' },
              { avatar: '👧', name: 'Sofia', action: 'marcou tarefas', time: 'Há 2 horas' }
            ].map((activity, idx) => (
              <Card key={idx} compact>
                <div className="flex items-center gap-md">
                  <div className="text-2xl">{activity.avatar}</div>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-semibold">{activity.name}</span>{' '}
                      <span className="text-gray-600">{activity.action}</span>
                    </p>
                    <small className="text-gray-500">{activity.time}</small>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </main>

      {/* BOTTOM NAVIGATION */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex items-center justify-around p-md">
        {[
          { icon: '🏠', label: 'Início', active: true },
          { icon: '📅', label: 'Calendário', active: false },
          { icon: '✓', label: 'Tarefas', active: false },
          { icon: '💬', label: 'Chat', active: false },
          { icon: '👥', label: 'Membros', active: false }
        ].map((nav, idx) => (
          <button
            key={idx}
            className={`flex flex-col items-center gap-xs py-sm px-lg transition-colors ${
              nav.active ? 'text-indigo-600' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="text-2xl">{nav.icon}</span>
            <small className="text-xs">{nav.label}</small>
          </button>
        ))}
      </nav>
    </div>
  );
};
