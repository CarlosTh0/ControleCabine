import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { BoxData, ControlEntry } from '@/types';
import BoxGrid from '@/components/BoxGrid';
import ControlTable from '@/components/ControlTable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BoxIcon, Truck, PackageCheck, AlertTriangle, Clock, Calendar, BarChart3, Activity, Timer, TrendingUp } from 'lucide-react';
import { getBoxes, getEntries, updateBox, addEntry, clearEntries } from '@/lib/db';
import { useToast } from "@/components/ui/use-toast";
import { twMerge } from 'tailwind-merge';
import { Box, BoxStatus } from '@/types/box';
import { TableEntry } from '@/types/table';
import Sidebar from '@/components/Sidebar';
import { useMediaQuery } from '@/hooks/use-media-query';
import Reports from '@/components/Reports';
import { Settings } from '@/components/Settings';
import ShiftClose from '@/components/ShiftClose';
import { initConfig } from '@/lib/config';

export default function IndexPage() {
  const location = useLocation();
  const [tableEntries, setTableEntries] = useState<ControlEntry[]>([]);
  const [boxData, setBoxData] = useState<BoxData[]>([]);
  const [activeView, setActiveView] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { toast } = useToast();
  const [lastToastTime, setLastToastTime] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  const [stats, setStats] = useState({
    totalBoxes: 0,
    freeBoxes: 0,
    occupiedBoxes: 0,
    blockedBoxes: 0,
    todayTrips: 0,
    pendingBoxes: 0,
    averageLoadTime: 0,
    completionRate: 0
  });

  // Função auxiliar para mostrar toast com limite de frequência
  const showToast = (title: string, description: string, type: 'success' | 'error' = 'success') => {
    const now = Date.now();
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
    async function initialize() {
      try {
        console.log('Inicializando bancos de dados...');
        await initConfig();
        console.log('Banco de dados de configurações inicializado');
        setIsInitialized(true);
      } catch (error) {
        console.error('Erro ao inicializar bancos de dados:', error);
        showToast(
          'Erro de inicialização',
          'Não foi possível inicializar os bancos de dados.',
          'error'
        );
      }
    }

    initialize();
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

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
          const initialBoxes: BoxData[] = [];
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
  }, [isInitialized]);

  useEffect(() => {
    if (boxData && tableEntries) {
      const today = new Date();
      const todayEntries = tableEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate.toDateString() === today.toDateString();
      });

      // Calcula o tempo médio de carregamento
      const loadTimes = todayEntries
        .filter(entry => entry.boxInside && entry.date)
        .map(entry => {
          const startTime = new Date(entry.date);
          const endTime = new Date(entry.boxInside);
          return (endTime.getTime() - startTime.getTime()) / (1000 * 60); // em minutos
        });

      const averageLoadTime = loadTimes.length > 0 
        ? loadTimes.reduce((acc, time) => acc + time, 0) / loadTimes.length 
        : 0;

      // Calcula a taxa de conclusão
      const completionRate = todayEntries.length > 0
        ? (todayEntries.filter(entry => entry.boxInside).length / todayEntries.length) * 100
        : 0;

      setStats({
        totalBoxes: boxData.length,
        freeBoxes: boxData.filter(box => box.status === 'free').length,
        occupiedBoxes: boxData.filter(box => box.status === 'occupied').length,
        blockedBoxes: boxData.filter(box => box.status === 'blocked').length,
        todayTrips: todayEntries.length,
        pendingBoxes: tableEntries.filter(entry => !entry.boxInside).length,
        averageLoadTime: Math.round(averageLoadTime),
        completionRate: Math.round(completionRate)
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
      // Atualiza o estado e localStorage imediatamente
      setTableEntries(newEntries);
      localStorage.setItem('tableEntries', JSON.stringify(newEntries));

      try {
        // Se todas as entradas foram removidas
        if (newEntries.length === 0) {
          await clearEntries();
          showToast(
            "Dados limpos",
            "Todas as entradas foram removidas com sucesso.",
            'success'
          );
          return;
        }

        // Limpa todas as entradas no IndexedDB e adiciona as novas
        await clearEntries();
        // Adiciona as novas entradas uma por uma
        for (const entry of newEntries) {
          await addEntry(entry);
        }

      } catch (dbError) {
        console.error('Erro ao salvar no IndexedDB:', dbError);
        showToast(
          "Salvamento parcial",
          "Alterações salvas apenas localmente devido a um erro no banco de dados.",
          'error'
        );
      }
    } catch (error) {
      console.error('Erro ao modificar entradas:', error);
      showToast(
        "Erro ao salvar",
        "Ocorreu um erro ao tentar salvar as alterações.",
        'error'
      );
    }
  };

  // Atualiza activeView baseado na rota atual
  useEffect(() => {
    const path = location.pathname.slice(1) || 'dashboard';
    setActiveView(path);
  }, [location]);

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Boxes Livres */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Boxes Livres
                  </CardTitle>
                  <BoxIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.freeBoxes}</div>
                  <p className="text-xs text-muted-foreground">
                    de {stats.totalBoxes} boxes totais
                  </p>
                </CardContent>
              </Card>

              {/* Viagens Hoje */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Viagens Hoje
                  </CardTitle>
                  <Truck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.todayTrips}</div>
                  <p className="text-xs text-muted-foreground">
                    viagens registradas
                  </p>
                </CardContent>
              </Card>

              {/* Tempo Médio */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Tempo Médio
                  </CardTitle>
                  <Timer className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.averageLoadTime} min</div>
                  <p className="text-xs text-muted-foreground">
                    de carregamento
                  </p>
                </CardContent>
              </Card>

              {/* Taxa de Conclusão */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Taxa de Conclusão
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.completionRate}%</div>
                  <p className="text-xs text-muted-foreground">
                    das viagens de hoje
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Métricas Secundárias */}
            <div className="grid gap-4 md:grid-cols-3">
              {/* Status dos Boxes */}
              <Card>
                <CardHeader>
                  <CardTitle>Status dos Boxes</CardTitle>
                  <CardDescription>Distribuição atual dos boxes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Livres</span>
                      <span className="text-sm font-medium text-green-600">{stats.freeBoxes}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Ocupados</span>
                      <span className="text-sm font-medium text-yellow-600">{stats.occupiedBoxes}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Bloqueados</span>
                      <span className="text-sm font-medium text-red-600">{stats.blockedBoxes}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pendências */}
              <Card>
                <CardHeader>
                  <CardTitle>Pendências</CardTitle>
                  <CardDescription>Viagens aguardando processamento</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Sem BOX-D</span>
                      <span className="text-sm font-medium text-red-600">{stats.pendingBoxes}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Em Processamento</span>
                      <span className="text-sm font-medium text-yellow-600">
                        {Math.round(stats.todayTrips - (stats.todayTrips * stats.completionRate / 100))}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Eficiência */}
              <Card>
                <CardHeader>
                  <CardTitle>Eficiência</CardTitle>
                  <CardDescription>Métricas de desempenho do dia</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Taxa de Ocupação</span>
                      <span className="text-sm font-medium text-blue-600">
                        {Math.round((stats.occupiedBoxes / stats.totalBoxes) * 100)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Tempo Médio</span>
                      <span className="text-sm font-medium text-purple-600">
                        {stats.averageLoadTime} min
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      case 'trip':
        return (
          <div className="space-y-6">
            <ControlTable 
              entries={tableEntries}
              onEntriesChange={handleEntriesChange}
              boxData={boxData}
              onBoxDataChange={handleBoxDataChange}
              availablePreBoxes={boxData.map(box => box.id)}
            />
          </div>
        );
      case 'prebox':
        return (
          <BoxGrid
            boxData={boxData}
            onBoxDataChange={handleBoxDataChange}
            tableEntries={tableEntries}
            isEditable
          />
        );
      case 'reports':
        return <Reports boxData={boxData} tableEntries={tableEntries} />;
      case 'shift':
        return <ShiftClose boxData={boxData} tableEntries={tableEntries} />;
      case 'settings':
        return <Settings />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        isMobile={isMobile}
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <main className={twMerge(
        "transition-all duration-300 p-8",
        isSidebarCollapsed ? "ml-16" : "ml-64"
      )}>
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
