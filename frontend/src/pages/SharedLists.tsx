import React, { useState } from 'react';
import { Button, Card, Input } from '../components/UI/index';

interface ListItem {
  id: string;
  title: string;
  quantity: number;
  unit: string;
  category: string;
  checked: boolean;
  checkedBy?: string;
  addedBy: string;
  addedAt: string;
}

interface SharedList {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  itemCount: number;
  checkedCount: number;
  members: Array<{ name: string; avatar: string }>;
  lastUpdated: string;
}

export const SharedLists: React.FC = () => {
  const [selectedList, setSelectedList] = useState<string>('1');
  const [newItem, setNewItem] = useState('');
  const [showAddItem, setShowAddItem] = useState(false);

  // Mock data
  const lists: SharedList[] = [
    {
      id: '1',
      name: '🛒 Supermercado',
      description: 'Compras do mês de julho',
      createdBy: 'Maria',
      itemCount: 12,
      checkedCount: 5,
      members: [
        { name: 'Maria', avatar: '👩' },
        { name: 'João', avatar: '👨' },
        { name: 'Sofia', avatar: '👧' }
      ],
      lastUpdated: 'Há 20 min'
    }
  ];

  const items: ListItem[] = [
    {
      id: '1',
      title: 'Arroz integral',
      quantity: 2,
      unit: 'kg',
      category: 'Secos',
      checked: true,
      checkedBy: 'João',
      addedBy: 'Maria',
      addedAt: 'Hoje'
    },
    {
      id: '2',
      title: 'Feijão preto',
      quantity: 1,
      unit: 'kg',
      category: 'Secos',
      checked: true,
      checkedBy: 'Maria',
      addedBy: 'Maria',
      addedAt: 'Hoje'
    },
    {
      id: '3',
      title: 'Leite integral',
      quantity: 3,
      unit: 'l',
      category: 'Lácteos',
      checked: false,
      addedBy: 'Sofia',
      addedAt: 'Hoje'
    },
    {
      id: '4',
      title: 'Pão integral',
      quantity: 2,
      unit: 'un',
      category: 'Padaria',
      checked: false,
      addedBy: 'João',
      addedAt: 'Hoje'
    }
  ];

  const current = lists.find((l) => l.id === selectedList) || lists[0];
  const progress = (current.checkedCount / current.itemCount) * 100;

  const categoryEmojis: Record<string, string> = {
    'Secos': '🌾',
    'Lácteos': '🥛',
    'Padaria': '🍞',
    'Frutas': '🍎',
    'Verduras': '🥬',
    'Carnes': '🥩',
    'Bebidas': '🥤'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 pb-24">
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 p-lg sticky top-0 z-fixed">
        <h1 className="text-2xl font-bold mb-lg">Listas Compartilhadas</h1>

        {/* LIST TABS */}
        <div className="flex gap-md overflow-x-auto pb-md">
          {lists.map((list) => (
            <button
              key={list.id}
              onClick={() => setSelectedList(list.id)}
              className={`px-lg py-sm rounded-full font-semibold text-sm whitespace-nowrap transition-all ${
                selectedList === list.id
                  ? 'bg-gradient-primary text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {list.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </header>

      <main className="p-lg">
        {/* LIST INFO */}
        <Card className="mb-lg bg-gradient-primary text-white">
          <div className="flex items-center justify-between mb-lg">
            <div>
              <h2 className="text-2xl font-bold">{current.name}</h2>
              <small className="opacity-90">{current.description}</small>
            </div>
            <button className="text-2xl opacity-75 hover:opacity-100">⚙️</button>
          </div>

          {/* PROGRESS BAR */}
          <div className="space-y-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Progresso</span>
              <span className="text-sm">
                {current.checkedCount}/{current.itemCount}
              </span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3">
              <div
                className="bg-white h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* MEMBERS */}
          <div className="mt-lg">
            <p className="text-sm font-semibold mb-sm">Membros</p>
            <div className="flex items-center gap-sm">
              {current.members.map((member, idx) => (
                <div
                  key={idx}
                  className="w-10 h-10 bg-white/30 rounded-lg flex items-center justify-center text-lg hover:bg-white/40 transition-all"
                  title={member.name}
                >
                  {member.avatar}
                </div>
              ))}
              <button className="w-10 h-10 bg-white/30 rounded-lg flex items-center justify-center hover:bg-white/40 transition-all text-lg">
                ➕
              </button>
            </div>
          </div>
        </Card>

        {/* ADD ITEM FORM */}
        {showAddItem && (
          <Card className="mb-lg border-2 border-indigo-300 bg-indigo-50 animate-slideUp">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setNewItem('');
                setShowAddItem(false);
              }}
              className="space-y-md"
            >
              <Input
                autoFocus
                placeholder="Adicione um novo item..."
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                icon="➕"
              />
              <div className="flex gap-md">
                <Button
                  type="button"
                  variant="ghost"
                  fullWidth
                  onClick={() => setShowAddItem(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                >
                  Adicionar
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* ITEMS BY CATEGORY */}
        <div className="space-y-lg">
          {['Secos', 'Lácteos', 'Padaria'].map((category) => {
            const categoryItems = items.filter((item) => item.category === category);
            if (categoryItems.length === 0) return null;

            return (
              <div key={category}>
                <h3 className="font-semibold text-sm text-gray-600 mb-md flex items-center gap-sm">
                  <span className="text-lg">{categoryEmojis[category] || '📦'}</span>
                  {category}
                </h3>

                <div className="space-y-sm">
                  {categoryItems.map((item) => (
                    <Card
                      key={item.id}
                      compact
                      className={`transition-all ${item.checked ? 'opacity-60 bg-gray-50' : ''}`}
                    >
                      <div className="flex items-center gap-md">
                        {/* CHECKBOX */}
                        <button
                          onClick={() => console.log('toggle', item.id)}
                          className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                            item.checked
                              ? 'bg-gradient-primary border-indigo-600 text-white'
                              : 'border-gray-300 hover:border-indigo-600'
                          }`}
                        >
                          {item.checked && '✓'}
                        </button>

                        {/* ITEM INFO */}
                        <div className="flex-1">
                          <p
                            className={`text-sm font-semibold ${
                              item.checked ? 'line-through text-gray-500' : 'text-gray-900'
                            }`}
                          >
                            {item.title}
                          </p>
                          <div className="flex items-center gap-sm mt-xs">
                            <small className="text-gray-600">
                              {item.quantity} {item.unit}
                            </small>
                            <span className="text-gray-300">•</span>
                            <small className="text-gray-500">por {item.addedBy}</small>
                          </div>
                        </div>

                        {/* ACTIONS */}
                        <div className="flex items-center gap-xs">
                          {item.checked && item.checkedBy && (
                            <span
                              title={`Marcado por ${item.checkedBy}`}
                              className="text-lg"
                            >
                              ✓
                            </span>
                          )}
                          <button className="text-gray-400 hover:text-red-600 transition-colors text-lg">
                            ✕
                          </button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* EMPTY STATE */}
        {items.length === 0 && (
          <Card className="text-center py-xl border-2 border-dashed border-gray-300">
            <div className="text-4xl mb-md">📋</div>
            <p className="font-semibold text-gray-900 mb-sm">Nenhum item ainda</p>
            <small className="text-gray-600">Comece a adicionar itens à sua lista</small>
          </Card>
        )}
      </main>

      {/* FLOATING ACTION BUTTON */}
      <div className="fixed bottom-24 left-0 right-0 flex justify-center">
        {!showAddItem && (
          <Button
            onClick={() => setShowAddItem(true)}
            className="rounded-full w-14 h-14 text-xl shadow-xl"
          >
            ➕
          </Button>
        )}
      </div>
    </div>
  );
};
