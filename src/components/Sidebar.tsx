import React from 'react';
import { 
  Truck, 
  BarChart2, 
  Box, 
  FileText, 
  Clock, 
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ControlEntry, BoxData } from '@/types';
import { twMerge } from 'tailwind-merge';

interface SidebarProps {
  onViewChange: (view: 'trip' | 'dashboard' | 'prebox' | 'reports' | 'shift' | 'settings') => void;
  isOpen: boolean;
  tableEntries: ControlEntry[];
  boxData: BoxData[];
  activeView: string;
}

const Sidebar = ({ onViewChange, isOpen, tableEntries, boxData, activeView }: SidebarProps) => {
  const menuItems = [
    { id: 'trip', label: 'Controle de Viagem', icon: Truck },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
    { id: 'prebox', label: 'Gerenciar Pré-Box', icon: Box },
    { id: 'reports', label: 'Relatórios', icon: FileText },
    { id: 'shift', label: 'Fechamento de Turno', icon: Clock },
    { id: 'settings', label: 'Configurações', icon: Settings }
  ];

  return (
    <aside 
      className={twMerge(
        "fixed left-0 top-0 h-full bg-white w-64 shadow-lg z-50 transition-all duration-300",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex flex-col h-full">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-[#1197CE]">ControleCabine</h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                type="button"
                variant="ghost"
                className={twMerge(
                  "w-full justify-start text-gray-700 hover:bg-[#F3F3F3]",
                  activeView === item.id && "bg-[#F3F3F3] text-[#1197CE]"
                )}
                onClick={() => onViewChange(item.id as any)}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.label}
              </Button>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-700 hover:bg-[#F3F3F3]"
            onClick={() => onViewChange('settings')}
          >
            <Settings className="mr-3 h-5 w-5" />
            Configurações
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar; 