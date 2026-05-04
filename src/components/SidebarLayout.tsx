import React from "react";
import { LayoutDashboard, Users, UploadCloud, MessageSquare, LineChart, Settings } from "lucide-react";
import { cn } from "../lib/utils";

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export function SidebarLayout({ children, currentView, onViewChange }: React.PropsWithChildren<SidebarProps>) {
  const navItems = [
    { id: "dashboard", label: "Dashboard overview", icon: LayoutDashboard },
    { id: "students", label: "Student records", icon: Users },
    { id: "ingestion", label: "Data ingestion", icon: UploadCloud },
    { id: "communications", label: "Communications", icon: MessageSquare },
    { id: "reports", label: "Analytics & Reports", icon: LineChart },
    { id: "settings", label: "Tenant settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <nav className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-500 flex items-center justify-center font-bold text-white shadow">
              EI
            </div>
            <span className="text-white font-semibold tracking-tight text-lg">EduIntell</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 font-mono">Tenant: Acme University</div>
        </div>

        <div className="flex-1 px-4 space-y-1 mt-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                currentView === item.id
                  ? "bg-blue-600/10 text-blue-400"
                  : "hover:bg-slate-800 hover:text-slate-100"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-slate-700"></div>
            <div className="text-left flex-1 overflow-hidden">
              <div className="text-sm font-medium text-white truncate">Admin User</div>
              <div className="text-xs text-slate-500 truncate">admin@acme.edu</div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0">
          <h1 className="text-xl font-semibold text-gray-800 capitalize tracking-tight">
            {navItems.find((i) => i.id === currentView)?.label}
          </h1>
          <div className="flex gap-4">
            <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
              System Operational
            </span>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50">
          {children}
        </div>
      </main>
    </div>
  );
}
