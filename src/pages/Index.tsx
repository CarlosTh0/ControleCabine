import React, { useState, useEffect } from 'react';
import { BoxData, ControlEntry } from '@/types';
import BoxGrid from '@/components/BoxGrid';
import ControlTable from '@/components/ControlTable';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BoxIcon, Truck, PackageCheck, AlertTriangle, Clock, Calendar, BarChart3, Activity } from 'lucide-react';
import { getBoxes, getEntries, updateBox, addEntry, clearEntries } from '@/lib/db';
import { useToast } from "@/components/ui/use-toast";
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { twMerge } from 'tailwind-merge';
import { Box, BoxStatus } from '@/types/box';
import { TableEntry } from '@/types/table';

export default function IndexPage() {
  const [tableEntries, setTableEntries] = useState<ControlEntry[]>([]);
  const [boxData, setBoxData] = useState<BoxData[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { toast } = useToast();
  const [lastToastTime, setLastToastTime] = useState(0);

  const [stats, setStats] = useState({
    totalBoxes: 0,
    freeBoxes: 0,
    occupiedBoxes: 0,
    blockedBoxes: 0,
    todayTrips: 0,
    pendingBoxes: 0
  });

  // Função auxiliar para mostrar toast com limite de frequência
  const showToast = (title: string, description: string, type: 'success' | 'error' = 'success') => {
    const now = Date.now();
    // Só mostra toast se passou pelo menos 3 segundos desde o último
    if (now - lastToastTime > 3000) {
      toast({
        title,
        description,
        variant: type === 'error' ? "destructive" : "default"
      });
      setLastToastTime(now);
    }
  };

  useEffect(() => {
    // Carrega dados do banco de dados
    const loadData = async () => {
      let dbEntries: ControlEntry[] | null = null;
      let dbBoxes: BoxData[] | null = null;

      try {
        // Primeiro tenta carregar do localStorage para exibição imediata
        const localStorageEntries = localStorage.getItem('tableEntries');
        const localStorageBoxes = localStorage.getItem('boxData');

        if (localStorageEntries) {
          const parsedEntries = JSON.parse(localStorageEntries);
          setTableEntries(parsedEntries);
        }

        if (localStorageBoxes) {
          const parsedBoxes = JSON.parse(localStorageBoxes);
          setBoxData(parsedBoxes);
        }

        // Então tenta carregar do IndexedDB
        try {
          const [entries, boxes] = await Promise.all([
            getEntries(),
            getBoxes()
          ]);

          dbEntries = entries;
          dbBoxes = boxes;

          if (entries && entries.length > 0) {
            setTableEntries(entries);
            localStorage.setItem('tableEntries', JSON.stringify(entries));
          }

          if (boxes && boxes.length > 0) {
            setBoxData(boxes);
            localStorage.setItem('boxData', JSON.stringify(boxes));
          }
        } catch (dbError) {
          console.error('Erro ao carregar do IndexedDB:', dbError);
          // Se não conseguiu carregar do IndexedDB, mantém os dados do localStorage
        }

        // Se não houver dados em nenhum lugar, inicializa com dados vazios
        if (!localStorageBoxes && (!dbBoxes || dbBoxes.length === 0)) {
          const initialBoxes = Array.from({ length: 70 }, (_, i) => ({
            id: `${i + 1}`,
            trip: '',
            status: 'free' as const,
            lastUpdate: new Date().toISOString()
          }));
          setBoxData(initialBoxes);
          localStorage.setItem('boxData', JSON.stringify(initialBoxes));
        }

        if (!localStorageEntries && (!dbEntries || dbEntries.length === 0)) {
          localStorage.setItem('tableEntries', JSON.stringify([]));
        }

      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        // Se houver erro, tenta recuperar do localStorage
        const localStorageEntries = localStorage.getItem('tableEntries');
        const localStorageBoxes = localStorage.getItem('boxData');

        if (localStorageEntries) {
          setTableEntries(JSON.parse(localStorageEntries));
        }

        if (localStorageBoxes) {
          setBoxData(JSON.parse(localStorageBoxes));
        } else {
          // Se não houver nada no localStorage, cria dados iniciais
          const initialBoxes = Array.from({ length: 70 }, (_, i) => ({
            id: `${i + 1}`,
            trip: '',
            status: 'free' as const,
            lastUpdate: new Date().toISOString()
          }));
          setBoxData(initialBoxes);
          localStorage.setItem('boxData', JSON.stringify(initialBoxes));
          localStorage.setItem('tableEntries', JSON.stringify([]));
        }
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (boxData && tableEntries) {
      setStats({
        totalBoxes: boxData.length,
        freeBoxes: boxData.filter(box => box.status === 'free').length,
        occupiedBoxes: boxData.filter(box => box.status === 'occupied').length,
        blockedBoxes: boxData.filter(box => box.status === 'blocked').length,
        todayTrips: tableEntries.filter(entry => {
          const today = new Date();
          const entryDate = new Date(entry.date);
          return entryDate.toDateString() === today.toDateString();
        }).length,
        pendingBoxes: tableEntries.filter(entry => !entry.boxInside).length,
      });
    }
  }, [boxData, tableEntries]);

  // Função para atualizar um box
  const handleBoxDataChange = async (newBoxData: BoxData[]) => {
    try {
      // Atualiza o estado local e localStorage imediatamente
      setBoxData(newBoxData);
      localStorage.setItem('boxData', JSON.stringify(newBoxData));

      // Conta quantos boxes foram realmente modificados
      const modificationsCount = newBoxData.filter(box => {
        const existingBox = boxData.find(b => b.id === box.id);
        return !existingBox || 
               existingBox.status !== box.status || 
               existingBox.trip !== box.trip;
      }).length;

      // Tenta atualizar no IndexedDB
      try {
        // Atualiza cada box modificado
        await Promise.all(newBoxData.map(box => {
          const existingBox = boxData.find(b => b.id === box.id);
          if (!existingBox || 
              existingBox.status !== box.status || 
              existingBox.trip !== box.trip) {
            return updateBox(box.id, box.status, box.trip);
          }
          return Promise.resolve();
        }));
        
        // Só mostra notificação se houve mudanças significativas
        if (modificationsCount > 0) {
          showToast(
            "Boxes atualizados",
            `${modificationsCount} ${modificationsCount === 1 ? 'box atualizado' : 'boxes atualizados'} com sucesso.`,
            'success'
          );
        }
      } catch (dbError) {
        console.error('Erro ao atualizar no IndexedDB:', dbError);
        // Se falhar no IndexedDB, mostra mensagem informando que salvou localmente
        if (modificationsCount > 0) {
          showToast(
            "Boxes atualizados",
            "Alterações salvas localmente.",
            'success'
          );
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar boxes:', error);
      showToast(
        "Erro ao atualizar boxes",
        "Não foi possível salvar as alterações.",
        'error'
      );
    }
  };

  // Função para adicionar uma nova entrada
  const handleEntriesChange = async (newEntries: ControlEntry[]) => {
    try {
      // Se todas as entradas foram removidas
      if (newEntries.length === 0) {
        await clearEntries();
        setTableEntries([]);
        localStorage.setItem('tableEntries', JSON.stringify([]));
        showToast(
          "Dados limpos",
          "Todas as entradas foram removidas com sucesso.",
          'success'
        );
        return;
      }

      // Se houve apenas uma deleção
      if (newEntries.length < tableEntries.length) {
        setTableEntries(newEntries);
        localStorage.setItem('tableEntries', JSON.stringify(newEntries));
        return;
      }

      // Se é uma nova entrada
      if (newEntries.length > tableEntries.length) {
        setTableEntries(newEntries); // Atualiza imediatamente para mostrar a nova linha
        try {
          // Tenta salvar no IndexedDB
          const newEntry = newEntries[newEntries.length - 1];
          await addEntry(newEntry);
        } catch (error) {
          console.error('Erro ao salvar no IndexedDB, usando localStorage:', error);
          localStorage.setItem('tableEntries', JSON.stringify(newEntries));
        }
        return;
      }

      // Para outras atualizações
      setTableEntries(newEntries);
      localStorage.setItem('tableEntries', JSON.stringify(newEntries));
      
    } catch (error) {
      console.error('Erro ao modificar entradas:', error);
      // Garante que o estado local está atualizado mesmo em caso de erro
      setTableEntries(newEntries);
      localStorage.setItem('tableEntries', JSON.stringify(newEntries));
    }
  };

  return (
    <div className="relative min-h-screen">
      <div className={`transition-all duration-300 ${isSidebarOpen ? 'mr-[400px]' : 'mr-[40px]'}`}>
        <div className="container mx-auto p-4">
          <h1 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-white">
            SISTEMA DE CONTROLE DE PRÉ-BOX
          </h1>
          
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dashboard" className="text-lg">
                <BarChart3 className="w-5 h-5 mr-2" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="pre-box" className="text-lg">
                <BoxIcon className="w-5 h-5 mr-2" />
                Controle de Pré-Box
              </TabsTrigger>
              <TabsTrigger value="trip" className="text-lg">
                <Truck className="w-5 h-5 mr-2" />
                Controle de Viagem
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="mt-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-7">
                  <CardContent className="p-4">
                    <BoxGrid 
                      boxData={boxData}
                      onBoxDataChange={handleBoxDataChange}
                      tableEntries={tableEntries}
                      readOnly={true}
                      compact={true}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="pre-box">
              <BoxGrid 
                boxData={boxData}
                onBoxDataChange={handleBoxDataChange}
                tableEntries={tableEntries}
              />
            </TabsContent>

            <TabsContent value="trip">
              <ControlTable 
                entries={tableEntries}
                onEntriesChange={handleEntriesChange}
                boxData={boxData}
                onBoxDataChange={handleBoxDataChange}
                availablePreBoxes={boxData.map(box => box.id)}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <DashboardSidebar 
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        tableEntries={tableEntries}
        boxData={boxData}
        activeTab={activeTab}
      />
    </div>
  );
}
