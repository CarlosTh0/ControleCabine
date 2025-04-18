
import { useState, useEffect } from 'react';
import BoxGrid from "@/components/BoxGrid";
import ControlTable from "@/components/ControlTable";
import { Toaster } from "@/components/ui/toaster";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, Table2 } from "lucide-react";

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
        
        <Tabs defaultValue="prebox" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="prebox" className="flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Controle de Pré-Box
            </TabsTrigger>
            <TabsTrigger value="viagem" className="flex items-center gap-2">
              <Table2 className="w-4 h-4" />
              Controle de Viagem
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="prebox" className="mb-8">
            <BoxGrid tableEntries={tableEntries} />
          </TabsContent>
          
          <TabsContent value="viagem" className="mb-16">
            <ControlTable 
              onEntryChange={handleTableEntriesChange} 
              tableTitle="CONTROLE DE VIAGEM"
            />
          </TabsContent>
        </Tabs>
        
        <Toaster />
      </div>
    </div>
  );
};

export default Index;

