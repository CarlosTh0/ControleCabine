
import { useState } from 'react';
import BoxGrid from "@/components/BoxGrid";
import ControlTable from "@/components/ControlTable";

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

  const handleTableEntriesChange = (entries: ControlEntry[]) => {
    setTableEntries(entries);
  };

  return (
    <div className="container mx-auto py-8 px-4 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-center">Sistema de Controle de Pré-Box</h1>
      <BoxGrid tableEntries={tableEntries} />
      <ControlTable 
        onEntryChange={handleTableEntriesChange} 
        tableTitle="Controle de Viagem"
      />
    </div>
  );
};

export default Index;
