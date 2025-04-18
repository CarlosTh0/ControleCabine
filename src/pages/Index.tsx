
import { useState, useEffect } from 'react';
import BoxGrid from "@/components/BoxGrid";
import ControlTable from "@/components/ControlTable";
import { Toaster } from "@/components/ui/toaster";

interface ControlEntry {
  date: string;
  trip: string;
  time: string;
  oldTrip: string;
  preBox: string;
  boxInside: string;
  quantity: number;
  shift: number;
  cargoType: string;
  region: string;
  status: string;
  manifestDate: string;
}

const Index = () => {
  const [tableEntries, setTableEntries] = useState<ControlEntry[]>([]);

  useEffect(() => {
    const savedEntries = localStorage.getItem('tableEntries');
    if (savedEntries) {
      try {
        setTableEntries(JSON.parse(savedEntries));
      } catch (e) {
        console.error('ERRO AO CARREGAR DADOS SALVOS:', e);
      }
    }
  }, []);

  const handleTableEntriesChange = (entries: ControlEntry[]) => {
    setTableEntries(entries);
  };

  return (
    <div className="min-h-screen bg-[#F6F6F7] dark:bg-[#1A1F2C]">
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-4xl font-bold mb-8 text-center text-[#1A1F2C] dark:text-white">
          SISTEMA DE CONTROLE DE PRÉ-BOX
        </h1>
        
        {/* BoxGrid container without sticky positioning */}
        <div className="mb-8">
          <BoxGrid tableEntries={tableEntries} />
        </div>
        
        {/* Tabela de Controle de Viagem com espaço extra abaixo */}
        <div className="mb-16">
          <ControlTable 
            onEntryChange={handleTableEntriesChange} 
            tableTitle="CONTROLE DE VIAGEM"
          />
        </div>
        <Toaster />
      </div>
    </div>
  );
};

export default Index;
