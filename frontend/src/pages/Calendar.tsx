import React, { useState } from 'react';
import { Button, Card, Badge } from '../components/UI/index';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  time: string;
  location?: string;
  participants: Array<{ name: string; avatar: string; status: 'accepted' | 'declined' | 'tentative' }>;
  description?: string;
  color: 'primary' | 'green' | 'amber' | 'red' | 'purple';
  createdBy: string;
}

export const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2024, 6, 3)); // Julho de 2024
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');

  // Mock data
  const events: CalendarEvent[] = [
    {
      id: '1',
      title: 'Reunião de Família',
      date: new Date(2024, 6, 5),
      time: '19:00',
      location: 'Casa',
      participants: [
        { name: 'Maria', avatar: '👩', status: 'accepted' },
        { name: 'João', avatar: '👨', status: 'accepted' },
        { name: 'Sofia', avatar: '👧', status: 'tentative' }
      ],
      description: 'Planejamento do mês',
      color: 'primary',
      createdBy: 'Maria'
    },
    {
      id: '2',
      title: 'Aniversário da Sofia',
      date: new Date(2024, 6, 12),
      time: '15:00',
      location: 'Parque',
      participants: [
        { name: 'Maria', avatar: '👩', status: 'accepted' },
        { name: 'João', avatar: '👨', status: 'accepted' }
      ],
      description: 'Festa surpresa',
      color: 'purple',
      createdBy: 'Maria'
    },
    {
      id: '3',
      title: 'Consulta do João',
      date: new Date(2024, 6, 8),
      time: '10:30',
      location: 'Clínica Dr. Silva',
      participants: [
        { name: 'João', avatar: '👨', status: 'accepted' }
      ],
      description: 'Check-up anual',
      color: 'green',
      createdBy: 'Maria'
    },
    {
      id: '4',
      title: 'Supermercado',
      date: new Date(2024, 6, 6),
      time: '14:00',
      location: 'Carrefour',
      participants: [
        { name: 'Maria', avatar: '👩', status: 'accepted' },
        { name: 'Sofia', avatar: '👧', status: 'declined' }
      ],
      color: 'amber',
      createdBy: 'Maria'
    }
  ];

  const colorMap: Record<string, string> = {
    primary: 'bg-indigo-100 border-indigo-300 text-indigo-900',
    green: 'bg-green-100 border-green-300 text-green-900',
    amber: 'bg-amber-100 border-amber-300 text-amber-900',
    red: 'bg-red-100 border-red-300 text-red-900',
    purple: 'bg-purple-100 border-purple-300 text-purple-900'
  };

  const colorBadge: Record<string, string> = {
    primary: 'primary',
    green: 'success',
    amber: 'warning',
    red: 'danger',
    purple: 'primary'
  };

  // Get days in month
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
  }

  const getEventsForDate = (date: Date) => {
    return events.filter(
      (e) =>
        e.date.getFullYear() === date.getFullYear() &&
        e.date.getMonth() === date.getMonth() &&
        e.date.getDate() === date.getDate()
    );
  };

  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 pb-24">
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 p-lg sticky top-0 z-fixed">
        <div className="flex items-center justify-between mb-lg">
          <h1 className="text-2xl font-bold">Calendário</h1>
          <Button variant="primary" size="sm">
            ➕ Novo
          </Button>
        </div>

        {/* VIEW TOGGLE */}
        <div className="flex gap-sm">
          {(['month', 'week', 'day'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-lg py-sm rounded-lg font-semibold text-sm transition-all capitalize ${
                view === v
                  ? 'bg-gradient-primary text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </header>

      <main className="p-lg">
        {/* MONTH NAVIGATION */}
        <div className="flex items-center justify-between mb-lg">
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
            className="text-2xl hover:opacity-75 transition-opacity"
          >
            ←
          </button>
          <h2 className="text-xl font-bold capitalize">{monthName}</h2>
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
            className="text-2xl hover:opacity-75 transition-opacity"
          >
            →
          </button>
        </div>

        {/* CALENDAR GRID */}
        <Card className="mb-xl">
          {/* WEEKDAY HEADER */}
          <div className="grid grid-cols-7 gap-sm mb-lg">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map((day) => (
              <div key={day} className="text-center font-semibold text-sm text-gray-600">
                {day}
              </div>
            ))}
          </div>

          {/* DAYS */}
          <div className="grid grid-cols-7 gap-sm">
            {days.map((date, idx) => {
              if (!date) {
                return <div key={`empty-${idx}`} className="aspect-square" />;
              }

              const dayEvents = getEventsForDate(date);
              const isToday =
                date.toDateString() === new Date().toDateString();
              const isSelected = selectedDate?.toDateString() === date.toDateString();

              return (
                <button
                  key={date.toISOString()}
                  onClick={() => setSelectedDate(date)}
                  className={`aspect-square p-sm rounded-lg border-2 transition-all ${
                    isToday
                      ? 'bg-gradient-primary text-white border-indigo-600'
                      : isSelected
                      ? 'border-indigo-600 bg-indigo-50'
                      : dayEvents.length > 0
                      ? 'bg-blue-50 border-blue-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-xs font-semibold">{date.getDate()}</div>
                  {dayEvents.length > 0 && (
                    <div className="flex gap-xs mt-xs">
                      {dayEvents.slice(0, 2).map((e, i) => (
                        <div
                          key={i}
                          className="w-1 h-1 rounded-full"
                          style={{
                            backgroundColor:
                              e.color === 'primary'
                                ? '#6366f1'
                                : e.color === 'green'
                                ? '#10b981'
                                : e.color === 'amber'
                                ? '#f59e0b'
                                : '#a855f7'
                          }}
                        />
                      ))}
                      {dayEvents.length > 2 && (
                        <small className="text-xs opacity-75">+{dayEvents.length - 2}</small>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        {/* SELECTED DATE EVENTS */}
        {selectedDate && (
          <div className="space-y-lg animate-slideUp">
            <h2 className="text-xl font-bold">
              {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h2>

            {getEventsForDate(selectedDate).length > 0 ? (
              <div className="space-y-md">
                {getEventsForDate(selectedDate).map((event) => (
                  <Card
                    key={event.id}
                    className={`border-l-4 cursor-pointer hover:shadow-lg transition-all ${colorMap[event.color]}`}
                  >
                    <div className="flex items-start justify-between mb-md">
                      <div>
                        <h3 className="font-bold text-lg">{event.title}</h3>
                        <div className="flex items-center gap-sm text-sm mt-xs">
                          <span>🕐 {event.time}</span>
                          {event.location && <span>📍 {event.location}</span>}
                        </div>
                      </div>
                      <button className="text-lg opacity-75 hover:opacity-100">⋯</button>
                    </div>

                    {event.description && (
                      <p className="text-sm mb-md opacity-90">{event.description}</p>
                    )}

                    {/* PARTICIPANTS */}
                    <div className="flex items-center gap-sm">
                      {event.participants.map((p, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-xs"
                          title={`${p.name} - ${p.status}`}
                        >
                          <span className="text-lg">{p.avatar}</span>
                          {p.status === 'accepted' && <span className="text-green-600 text-xs">✓</span>}
                          {p.status === 'declined' && <span className="text-red-600 text-xs">✕</span>}
                          {p.status === 'tentative' && <span className="text-amber-600 text-xs">?</span>}
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-xl border-2 border-dashed border-gray-300">
                <p className="text-gray-600">Nenhum evento neste dia</p>
                <Button variant="ghost" className="mt-md" size="sm">
                  ➕ Criar evento
                </Button>
              </Card>
            )}
          </div>
        )}

        {/* UPCOMING EVENTS */}
        {!selectedDate && (
          <div>
            <h2 className="text-lg font-bold mb-lg">Próximos Eventos</h2>
            <div className="space-y-md">
              {events
                .filter((e) => e.date >= currentDate)
                .sort((a, b) => a.date.getTime() - b.date.getTime())
                .slice(0, 5)
                .map((event) => (
                  <Card key={event.id} className="cursor-pointer hover:shadow-lg transition-all">
                    <div className="flex items-center gap-lg">
                      <div className="flex flex-col items-center bg-gray-100 rounded-lg p-md min-w-16">
                        <span className="text-2xl font-bold text-indigo-600">
                          {event.date.getDate()}
                        </span>
                        <span className="text-xs text-gray-600 uppercase">
                          {event.date.toLocaleDateString('pt-BR', { month: 'short' })}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold">{event.title}</h3>
                        <div className="flex items-center gap-md mt-xs">
                          <small className="text-gray-600">🕐 {event.time}</small>
                          {event.location && <small className="text-gray-600">📍 {event.location}</small>}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={colorBadge[event.color] as any}>
                          {event.participants.length} presentes
                        </Badge>
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
