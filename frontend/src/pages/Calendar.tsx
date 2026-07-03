import React, { useState, useEffect } from "react";
import { Button, Card, TextInput } from "../components/ui";

interface CalendarEvent {
  id: string;
  title: string;
  dateStr: string; // "YYYY-MM-DD"
  time: string;
  description?: string;
  priority: "low" | "normal" | "high";
  completed: boolean;
}

export const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("12:00");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "normal" | "high">("normal");

  // Load events from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("markt_calendar_events");
    if (saved) {
      try {
        setEvents(JSON.parse(saved));
      } catch (e) {
        console.error("Erro ao carregar eventos:", e);
      }
    }
  }, []);

  // Save events to localStorage when changed
  function saveEvents(newEvents: CalendarEvent[]) {
    setEvents(newEvents);
    localStorage.setItem("markt_calendar_events", JSON.stringify(newEvents));
  }

  // Get format date string "YYYY-MM-DD"
  function getDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const selectedDateStr = getDateString(selectedDate);
  const selectedEvents = events.filter((e) => e.dateStr === selectedDateStr);

  // Month calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const daysArray: (Date | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push(new Date(year, month, i));
  }

  // Navigation handlers
  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  // Next month
  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  // Add Event handler
  function handleAddEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    const newEvent: CalendarEvent = {
      id: "event-" + Date.now(),
      title: title.trim(),
      dateStr: selectedDateStr,
      time,
      description: description.trim() || undefined,
      priority,
      completed: false,
    };

    const updated = [...events, newEvent].sort((a, b) => a.time.localeCompare(b.time));
    saveEvents(updated);

    // Reset Form
    setTitle("");
    setTime("12:00");
    setDescription("");
    setPriority("normal");
    setShowAddForm(false);
  }

  // Complete/Toggle handler
  function toggleEventCompleted(id: string) {
    const updated = events.map((e) => (e.id === id ? { ...e, completed: !e.completed } : e));
    saveEvents(updated);
  }

  // Delete handler
  function deleteEvent(id: string) {
    if (confirm("Deseja realmente excluir este compromisso?")) {
      const updated = events.filter((e) => e.id !== id);
      saveEvents(updated);
    }
  }

  const monthName = currentDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  // Priority color helper
  const priorityDots: Record<string, string> = {
    low: "bg-forest-500",
    normal: "bg-indigo-500",
    high: "bg-clay-600",
  };

  return (
    <div className="mx-auto max-w-md px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight font-display">Calendário</h1>
        <p className="text-xs text-gray-600 font-semibold mt-1">Planeje lembretes e tarefas para suas compras</p>
      </div>

      {/* CALENDAR BODY */}
      <Card className="p-4 border border-cream-200 bg-white">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-2 text-gray-600 hover:text-white transition cursor-pointer font-bold">
            &larr;
          </button>
          <span className="text-sm font-bold text-white capitalize">{monthName}</span>
          <button onClick={nextMonth} className="p-2 text-gray-600 hover:text-white transition cursor-pointer font-bold">
            &rarr;
          </button>
        </div>

        {/* DAY NAMES */}
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {dayNames.map((name) => (
            <span key={name} className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">
              {name}
            </span>
          ))}
        </div>

        {/* DAYS GRID */}
        <div className="grid grid-cols-7 gap-1">
          {daysArray.map((date, idx) => {
            if (!date) return <div key={`empty-${idx}`} />;

            const dateStr = getDateString(date);
            const isSelected = dateStr === selectedDateStr;
            const hasEvents = events.some((e) => e.dateStr === dateStr);
            const isToday = getDateString(new Date()) === dateStr;

            return (
              <button
                key={dateStr}
                onClick={() => {
                  setSelectedDate(date);
                  setShowAddForm(false);
                }}
                className={`relative flex flex-col items-center justify-center h-11 w-full rounded-xl transition cursor-pointer ${
                  isSelected
                    ? "bg-indigo-600 text-white font-bold"
                    : isToday
                    ? "bg-gray-100 text-white border border-indigo-600/50 font-semibold"
                    : "hover:bg-gray-100 text-gray-600 hover:text-white"
                }`}
              >
                <span className="text-xs">{date.getDate()}</span>
                {hasEvents && !isSelected && (
                  <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-indigo-500" />
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* SELECTED DATE DETAILS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">
            Compromissos · {selectedDate.toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
          </p>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
            >
              + Adicionar
            </button>
          )}
        </div>

        {/* ADD EVENT FORM */}
        {showAddForm && (
          <Card className="p-4 border border-cream-200 bg-white animate-fade-in">
            <p className="font-bold text-white text-sm mb-3">Novo Lembrete para {selectedDate.toLocaleDateString("pt-BR")}</p>
            <form onSubmit={handleAddEvent} className="space-y-3">
              <TextInput
                label="Título / Item"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Comprar verduras frescas"
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <TextInput
                  label="Horário"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Prioridade</label>
                  <select
                    value={priority}
                    onChange={(e: any) => setPriority(e.target.value)}
                    className="w-full h-[40px] px-3 border border-gray-200 rounded-xl bg-white text-white text-xs font-semibold focus:border-indigo-600 focus:outline-none transition"
                  >
                    <option value="low">Baixa</option>
                    <option value="normal">Média</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
              </div>
              <TextInput
                label="Descrição (opcional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Ir no mercado do bairro porque alface está em oferta"
              />
              <div className="flex gap-2 pt-1">
                <Button type="submit" className="flex-1">
                  Salvar
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowAddForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* EVENTS LIST */}
        <div className="space-y-2">
          {selectedEvents.length === 0 ? (
            <p className="text-sm text-gray-600 font-medium text-center py-4">
              Nenhum compromisso ou tarefa para esta data.
            </p>
          ) : (
            selectedEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between rounded-xl bg-white px-4 py-3 border border-cream-200/60 shadow-sm transition-all hover:shadow"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Status checkbox */}
                  <button
                    onClick={() => toggleEventCompleted(event.id)}
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border-2 transition cursor-pointer ${
                      event.completed
                        ? "bg-forest-500 border-forest-500 text-white"
                        : "border-gray-200 hover:border-indigo-500"
                    }`}
                  >
                    {event.completed && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-3 w-3">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-bold truncate ${
                        event.completed ? "text-gray-600 line-through" : "text-white"
                      }`}
                    >
                      {event.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-bold text-gray-600">{event.time}</span>
                      <span className={`h-1.5 w-1.5 rounded-full ${priorityDots[event.priority]}`} />
                      {event.description && (
                        <span className="text-[10px] text-gray-600 truncate max-w-[180px]">
                          · {event.description}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => deleteEvent(event.id)}
                  className="rounded-lg p-1.5 text-gray-600 hover:bg-clay-100 hover:text-clay-600 transition cursor-pointer"
                  aria-label="Excluir"
                >
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                    <path d="M19 4h-4V3a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v1H5v2h1v13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6h1V4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
