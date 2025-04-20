import React, { useState, useEffect } from 'react';
import { BoxData, ControlEntry } from '@/types';
import BoxGrid from '@/components/BoxGrid';
import ControlTable from '@/components/ControlTable';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Box, Truck, PackageCheck, AlertTriangle } from 'lucide-react';
import { getBoxes, getEntries, updateBox, addEntry, clearEntries } from '@/lib/db';
import { useToast } from "@/components/ui/use-toast";

export default function IndexPage() {
  const [tableEntries, setTableEntries] = useState<ControlEntry[]>([]);
  const [boxData, setBoxData] = useState<BoxData[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const { toast } = useToast();
  const [lastToastTime, setLastToastTime] = useState(0);

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

  // Cálculo das estatísticas
  const stats = {
    totalBoxes: boxData.length,
    freeBoxes: boxData.filter(box => box.status === 'free').length,
    occupiedBoxes: boxData.filter(box => box.status === 'occupied').length,
    blockedBoxes: boxData.filter(box => box.status === 'blocked').length,
    todayTrips: tableEntries.filter(entry => 
      new Date(entry.date).toDateString() === new Date().toDateString()
    ).length,
    pendingBoxes: tableEntries.filter(entry => entry.preBox && !entry.boxInside).length
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-white">
        SISTEMA DE CONTROLE DE PRÉ-BOX
      </h1>

      <Tabs defaultValue={activeTab} className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="dashboard" className="text-base">Dashboard</TabsTrigger>
          <TabsTrigger value="boxes" className="text-base">Controle de Pré-Box</TabsTrigger>
          <TabsTrigger value="trips" className="text-base">Controle de Viagem</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Card de Boxes Livres */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Boxes Livres
                </CardTitle>
                <Box className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.freeBoxes}</div>
                <p className="text-xs text-muted-foreground">
                  De um total de {stats.totalBoxes} boxes
                </p>
              </CardContent>
            </Card>

            {/* Card de Viagens do Dia */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Viagens Hoje
                </CardTitle>
                <Truck className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.todayTrips}</div>
                <p className="text-xs text-muted-foreground">
                  Viagens registradas hoje
                </p>
              </CardContent>
            </Card>

            {/* Card de Boxes Ocupados */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Boxes Ocupados
                </CardTitle>
                <PackageCheck className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.occupiedBoxes}</div>
                <p className="text-xs text-muted-foreground">
                  Boxes em uso no momento
                </p>
              </CardContent>
            </Card>

            {/* Card de Pendências */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pendências
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingBoxes}</div>
                <p className="text-xs text-muted-foreground">
                  Viagens aguardando BOX-D
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Visão Geral dos Boxes */}
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Visão Geral dos Boxes</CardTitle>
            </CardHeader>
            <CardContent>
              <BoxGrid
                tableEntries={tableEntries}
                onBoxDataChange={handleBoxDataChange}
                initialBoxData={boxData}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="boxes">
          <BoxGrid
            tableEntries={tableEntries}
            onBoxDataChange={handleBoxDataChange}
            initialBoxData={boxData}
          />
        </TabsContent>

        <TabsContent value="trips">
          <ControlTable
            entries={tableEntries}
            onEntriesChange={handleEntriesChange}
            availablePreBoxes={[]}
            boxData={boxData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
