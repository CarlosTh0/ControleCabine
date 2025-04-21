import React from 'react';
import { 
  Truck, 
  BarChart2, 
  Box, 
  FileText, 
  Clock, 
  Settings,
  Menu,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { NavLink } from 'react-router-dom';
import {
  FaTruck,
  FaTachometerAlt,
  FaBoxes,
  FaFileAlt,
  FaClock,
  FaCog,
} from 'react-icons/fa';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  isMobile?: boolean;
  isCollapsed?: boolean;
  onToggle?: () => void;
}

const menuItems = [
  { id: 'trip', label: 'Controle de Viagem', icon: <FaTruck /> },
  { id: 'prebox', label: 'Gerenciar Pré-Box', icon: <FaBoxes /> },
  { id: 'dashboard', label: 'Dashboard', icon: <FaTachometerAlt /> },
  { id: 'reports', label: 'Relatórios', icon: <FaFileAlt /> },
  { id: 'shift', label: 'Fechamento de Turno', icon: <FaClock /> },
  { id: 'settings', label: 'Configurações', icon: <FaCog /> },
];

const Sidebar = ({ activeView, onViewChange, isMobile = false, isCollapsed = false, onToggle }: SidebarProps) => {
  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-white transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
        "border-r border-gray-200"
      )}
    >
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-[#1197CE] tracking-tight">
                ControleCabine
              </h1>
            </div>
          )}
          <button
            onClick={onToggle}
            className={cn(
              "p-2 rounded-md hover:bg-gray-100 transition-colors",
              isCollapsed ? "ml-0" : "ml-auto"
            )}
            title={isCollapsed ? "Expandir menu" : "Recolher menu"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            
            return (
              <NavLink
                key={item.id}
                to={`/${item.id}`}
                className={({ isActive }) =>
                  cn(
                    "flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    "hover:bg-gray-50",
                    isActive ? "bg-[#F3F3F3] text-[#1197CE]" : "text-gray-700",
                    isCollapsed ? "justify-center" : "justify-start"
                  )
                }
              >
                <span className={cn(
                  "flex-shrink-0",
                  isCollapsed ? "w-6 h-6" : "w-5 h-5 mr-3"
                )}>
                  {Icon}
                </span>
                {!isCollapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar; 