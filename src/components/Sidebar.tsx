import React from 'react';
import { BarChart2, Box, Save, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ControlEntry, BoxData } from '@/types';

interface SidebarProps {
  onViewChange: (view: 'dashboard' | 'prebox' | 'trip' | 'backup') => void;
  isOpen: boolean;
  tableEntries: ControlEntry[];
  boxData: BoxData[];
}

const Sidebar = ({ onViewChange, isOpen, tableEntries, boxData }: SidebarProps) => {
  return (
    <aside 
      className={`fixed left-0 top-0 h-full bg-gray-900 text-white w-64 shadow-lg z-50 transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <nav className="flex flex-col h-full">
        <div className="p-4 space-y-4">
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-start text-white hover:bg-gray-800"
            onClick={() => onViewChange('dashboard')}
          >
            <BarChart2 className="mr-2 h-4 w-4" />
            Dashboard
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full justify-start text-white hover:bg-gray-800"
            onClick={() => onViewChange('prebox')}
          >
            <Box className="mr-2 h-4 w-4" />
            Controle de Pré-Box
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full justify-start text-white hover:bg-gray-800"
            onClick={() => onViewChange('trip')}
          >
            <Truck className="mr-2 h-4 w-4" />
            Controle de Viagem
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full justify-start text-white hover:bg-gray-800"
            onClick={() => onViewChange('backup')}
          >
            <Save className="mr-2 h-4 w-4" />
            Backup
          </Button>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar; 