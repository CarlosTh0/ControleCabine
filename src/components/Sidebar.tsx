import React from 'react';
import { BarChart2, Box, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BoxData, ControlEntry } from '@/types';

interface SidebarProps {
  onViewChange: (view: string) => void;
  isOpen: boolean;
  tableEntries: ControlEntry[];
  boxData: BoxData[];
}

const Sidebar = ({ onViewChange, isOpen, tableEntries, boxData }: SidebarProps) => {
  return (
    <div className={`fixed left-0 top-0 h-full bg-gray-900 text-white w-64 shadow-lg z-50 transition-transform duration-300 ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
      <div className="flex flex-col h-full">
        <div className="p-4 space-y-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-white hover:bg-gray-800"
            onClick={() => onViewChange('dashboard')}
          >
            <BarChart2 className="mr-2 h-4 w-4" />
            Dashboard
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start text-white hover:bg-gray-800"
            onClick={() => onViewChange('prebox')}
          >
            <Box className="mr-2 h-4 w-4" />
            Controle de Pré-Box
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start text-white hover:bg-gray-800"
            onClick={() => onViewChange('backup')}
          >
            <Save className="mr-2 h-4 w-4" />
            Backup
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 