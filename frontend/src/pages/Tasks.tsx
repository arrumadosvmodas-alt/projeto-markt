import React, { useState } from "react";
import { Button } from "../components/UI/Button";
import { Card } from "../components/UI/Card";
import { Input } from "../components/UI/Input";

interface Task {
  id: string;
  title: string;
  description?: string;
  assignedTo?: string;
  dueDate?: string;
  status: "pending" | "in_progress" | "completed";
  priority: "low" | "normal" | "high";
  createdBy: string;
}

export function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "1",
      title: "Comprar leite no supermercado",
      assignedTo: "Maria",
      dueDate: "2026-07-05",
      status: "pending",
      priority: "high",
      createdBy: "João",
    },
    {
      id: "2",
      title: "Pagar conta de água",
      dueDate: "2026-07-10",
      status: "in_progress",
      priority: "high",
      createdBy: "Maria",
    },
    {
      id: "3",
      title: "Limpar a geladeira",
      assignedTo: "Sofia",
      status: "completed",
      priority: "normal",
      createdBy: "Maria",
    },
  ]);

  const [newTask, setNewTask] = useState("");
  const [showForm, setShowForm] = useState(false);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    const task: Task = {
      id: Date.now().toString(),
      title: newTask,
      status: "pending",
      priority: "normal",
      createdBy: "Você",
    };

    setTasks([task, ...tasks]);
    setNewTask("");
    setShowForm(false);
  };

  const toggleStatus = (id: string) => {
    setTasks(
      tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              status: t.status === "completed" ? "pending" : "completed",
            }
          : t
      )
    );
  };

  const priorityColors: Record<string, string> = {
    low: "text-gray-500",
    normal: "text-amber-600",
    high: "text-red-600",
  };

  const priorityEmojis: Record<string, string> = {
    low: "🔵",
    normal: "🟠",
    high: "🔴",
  };



  return (
    <div className="space-y-lg pb-24">
      {/* HEADER */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-lg -mx-lg px-lg">
        <div className="flex items-center justify-between mb-lg">
          <h1 className="text-2xl font-bold">Tarefas</h1>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowForm(!showForm)}
          >
            ➕
          </Button>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-3 gap-sm">
          {[
            {
              label: "Pendentes",
              count: tasks.filter((t) => t.status === "pending").length,
              color: "text-orange-600",
            },
            {
              label: "Em Andamento",
              count: tasks.filter((t) => t.status === "in_progress").length,
              color: "text-blue-600",
            },
            {
              label: "Completas",
              count: tasks.filter((t) => t.status === "completed").length,
              color: "text-green-600",
            },
          ].map((stat) => (
            <Card compact key={stat.label}>
              <div className="text-center">
                <p className="text-xs text-gray-600">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>
                  {stat.count}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* ADD FORM */}
      {showForm && (
        <Card className="border-2 border-indigo-300 bg-indigo-50 animate-slideUp">
          <form onSubmit={handleAddTask} className="space-y-md">
            <Input
              autoFocus
              placeholder="O que precisa ser feito?"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              icon="✏️"
            />
            <div className="flex gap-md">
              <Button
                type="button"
                variant="ghost"
                fullWidth
                onClick={() => setShowForm(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="primary" fullWidth>
                Adicionar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* TASKS LIST */}
      <div className="space-y-md p-lg -mx-lg px-lg">
        {tasks.length === 0 ? (
          <Card className="text-center py-xl border-2 border-dashed border-gray-300">
            <p className="text-2xl mb-md">✅</p>
            <p className="font-semibold text-gray-900">Sem tarefas!</p>
            <small className="text-gray-600">Você está em dia</small>
          </Card>
        ) : (
          <>
            {/* PENDING */}
            {tasks.filter((t) => t.status === "pending").length > 0 && (
              <div>
                <h3 className="font-bold text-sm text-gray-600 mb-sm uppercase">
                  Pendentes
                </h3>
                <div className="space-y-sm">
                  {tasks
                    .filter((t) => t.status === "pending")
                    .map((task) => (
                      <Card
                        key={task.id}
                        compact
                        className="cursor-pointer hover:shadow-md transition-all"
                      >
                        <div className="flex items-start gap-md">
                          <button
                            onClick={() => toggleStatus(task.id)}
                            className="flex-shrink-0 w-6 h-6 rounded-md border-2 border-gray-300 hover:border-indigo-600 flex items-center justify-center transition-all mt-1"
                          >
                            ☐
                          </button>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">
                              {task.title}
                            </p>
                            <div className="flex items-center gap-md mt-xs flex-wrap">
                              {task.assignedTo && (
                                <small className="text-gray-600">
                                  👤 {task.assignedTo}
                                </small>
                              )}
                              {task.dueDate && (
                                <small className="text-gray-600">
                                  📅{" "}
                                  {new Date(task.dueDate).toLocaleDateString(
                                    "pt-BR"
                                  )}
                                </small>
                              )}
                            </div>
                          </div>
                          <span
                            className={`text-lg ${priorityColors[task.priority]}`}
                          >
                            {priorityEmojis[task.priority]}
                          </span>
                        </div>
                      </Card>
                    ))}
                </div>
              </div>
            )}

            {/* IN PROGRESS */}
            {tasks.filter((t) => t.status === "in_progress").length > 0 && (
              <div>
                <h3 className="font-bold text-sm text-gray-600 mb-sm uppercase">
                  Em Andamento
                </h3>
                <div className="space-y-sm">
                  {tasks
                    .filter((t) => t.status === "in_progress")
                    .map((task) => (
                      <Card key={task.id} compact className="bg-blue-50">
                        <div className="flex items-start gap-md">
                          <span className="text-xl">⏳</span>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">
                              {task.title}
                            </p>
                            <small className="text-gray-600">
                              {task.createdBy}
                            </small>
                          </div>
                        </div>
                      </Card>
                    ))}
                </div>
              </div>
            )}

            {/* COMPLETED */}
            {tasks.filter((t) => t.status === "completed").length > 0 && (
              <div>
                <h3 className="font-bold text-sm text-gray-600 mb-sm uppercase">
                  Completas
                </h3>
                <div className="space-y-sm">
                  {tasks
                    .filter((t) => t.status === "completed")
                    .map((task) => (
                      <Card
                        key={task.id}
                        compact
                        className="bg-green-50 opacity-75"
                      >
                        <div className="flex items-start gap-md">
                          <button
                            onClick={() => toggleStatus(task.id)}
                            className="flex-shrink-0 w-6 h-6 rounded-md bg-green-600 text-white flex items-center justify-center mt-1"
                          >
                            ✓
                          </button>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 line-through">
                              {task.title}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
