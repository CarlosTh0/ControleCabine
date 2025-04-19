import React, { useState, useEffect } from 'react';
import ControlTable from "@/components/ControlTable";
import BoxGrid from "@/components/BoxGrid";
import Dashboard from "@/components/Dashboard";
import Sidebar from '@/components/Sidebar';
import { Box, Truck } from 'lucide-react';
import { ControlEntry, BoxData, BoxStatus } from '@/types';

export default function Index() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'prebox' | 'trip' | 'backup'>('prebox');
  const [tableEntries, setTableEntries] = useState<ControlEntry[]>([]);
  const [boxData, setBoxData] = useState<BoxData[]>(() => {
    const savedBoxes = localStorage.getItem('boxData');
    if (savedBoxes) {
      const boxes = JSON.parse(savedBoxes);
      if (boxes.length > 0) {
        return boxes;
      }
    }

    // Criar array com os números dos boxes
    const boxNumbers = [
      // 50-56
      ...Array.from({ length: 7 }, (_, i) => i + 50),
      // 300-356
      ...Array.from({ length: 57 }, (_, i) => i + 300)
    ];

    // Criar boxes iniciais
    const initialBoxes = boxNumbers.map(num => ({
      id: num.toString().padStart(3, '0'),
      trip: '',
      status: 'free' as BoxStatus,
      lastUpdate: new Date().toISOString()
    }));

    localStorage.setItem('boxData', JSON.stringify(initialBoxes));
    return initialBoxes;
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Carregar dados iniciais
  useEffect(() => {
    const loadData = () => {
      const savedEntries = localStorage.getItem('tableEntries');
      if (savedEntries) {
        setTableEntries(JSON.parse(savedEntries));
      }
    };

    loadData();
  }, []);

  const handleViewChange = (view: 'dashboard' | 'prebox' | 'trip' | 'backup') => {
    setCurrentView(view);
  };

  const toggleSidebar = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSidebarOpen(prev => !prev);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar 
        onViewChange={handleViewChange} 
        isOpen={isSidebarOpen}
        tableEntries={tableEntries}
        boxData={boxData}
      />
      
      <main className={`transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <div className="sticky top-0 z-50 bg-white border-b">
          <div className="flex items-center p-4">
            <button
              type="button"
              onClick={toggleSidebar}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              {isSidebarOpen ? '←' : '☰'}
            </button>
            <h1 className="text-xl font-bold ml-4">SISTEMA DE CONTROLE DE PRÉ-BOX</h1>
          </div>

          <div className="flex justify-center space-x-8 p-2">
            <button
              onClick={() => handleViewChange('prebox')}
              className={`flex items-center space-x-2 px-4 py-2 ${
                currentView === 'prebox'
                  ? 'text-blue-600 font-medium'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Box className="h-4 w-4" />
              <span>Controle de Pré-Box</span>
            </button>
            <button
              onClick={() => handleViewChange('trip')}
              className={`flex items-center space-x-2 px-4 py-2 ${
                currentView === 'trip'
                  ? 'text-blue-600 font-medium'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Truck className="h-4 w-4" />
              <span>Controle de Viagem</span>
            </button>
          </div>
        </div>

        <div className="p-4">
          {currentView === 'dashboard' && (
            <Dashboard tableEntries={tableEntries} boxData={boxData} />
          )}

          {currentView === 'prebox' && (
            <div className="bg-white rounded-lg p-6">
              <BoxGrid
                tableEntries={tableEntries}
                onBoxDataChange={setBoxData}
                initialBoxData={boxData}
              />
            </div>
          )}

          {currentView === 'trip' && (
            <div className="bg-white rounded-lg p-6">
              <ControlTable
                entries={tableEntries}
                onEntriesChange={setTableEntries}
                availablePreBoxes={boxData
                  .filter(box => box.status === 'free')
                  .map(box => box.id)
                }
                tableTitle="Controle de Viagem"
                boxData={boxData}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
