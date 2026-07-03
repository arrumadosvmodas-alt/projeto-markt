
import { useLocation, Link } from "react-router-dom";

const navItems = [
  { icon: "🛒", label: "Comprar", path: "/" },
  { icon: "⏳", label: "Histórico", path: "/historico" },
  { icon: "📅", label: "Calendário", path: "/calendario" },
  { icon: "📊", label: "Análises", path: "/analises" },
  { icon: "👤", label: "Perfil", path: "/perfil" },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex items-center justify-around p-md shadow-2xl">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center gap-xs py-sm px-lg transition-all duration-200 ${
              isActive
                ? "text-indigo-600 scale-110"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <span className={`text-2xl ${isActive ? "scale-125" : ""}`}>
              {item.icon}
            </span>
            <small className={`text-xs font-semibold ${isActive ? "block" : "hidden sm:block"}`}>
              {item.label}
            </small>
          </Link>
        );
      })}
    </nav>
  );
}
