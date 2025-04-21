import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Clock, CheckCircle2, AlertTriangle, FileCheck, Send } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BoxData } from '@/types/box';
import { ControlEntry } from '@/types/control';

interface ShiftCloseProps {
  boxData: BoxData[];
  tableEntries: ControlEntry[];
}

const ShiftClose: React.FC<ShiftCloseProps> = ({ boxData, tableEntries }) => {
  const currentDate = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const currentTime = format(new Date(), 'HH:mm');

  // Calcula estatísticas do turno atual
  const today = new Date();
  const todayEntries = tableEntries.filter(entry => {
    const entryDate = new Date(entry.date);
    return entryDate.toDateString() === today.toDateString();
  });

  const shiftStats = {
    totalTrips: todayEntries.length,
    completedTrips: todayEntries.filter(entry => entry.boxInside).length,
    pendingTrips: todayEntries.filter(entry => !entry.boxInside).length,
    averageTime: calculateAverageTime(todayEntries),
    incidents: 0, // Será implementado quando tivermos um sistema de registro de incidentes
  };

  // Calcula o tempo médio de carregamento em minutos
  function calculateAverageTime(entries: ControlEntry[]): number {
    const loadTimes = entries
      .filter(entry => entry.boxInside && entry.date)
      .map(entry => {
        const startTime = new Date(entry.date);
        const endTime = new Date(entry.boxInside);
        return (endTime.getTime() - startTime.getTime()) / (1000 * 60); // em minutos
      });

    return loadTimes.length > 0
      ? Math.round(loadTimes.reduce((acc, time) => acc + time, 0) / loadTimes.length)
      : 0;
  }

  // Estatísticas dos boxes
  const boxStats = {
    total: boxData.length,
    empty: boxData.filter(box => box.status === 'free').length,
    occupied: boxData.filter(box => box.status === 'occupied').length,
    pending: boxData.filter(box => box.status === 'blocked').length
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Fechamento de Turno</h1>
        <div className="text-right">
          <p className="text-sm text-gray-500">{currentDate}</p>
          <p className="text-2xl font-bold text-gray-800">{currentTime}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Resumo do Turno */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Resumo do Turno
            </CardTitle>
            <CardDescription>
              Métricas e estatísticas do turno atual
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Total de Viagens</p>
                <p className="text-2xl font-bold">{shiftStats.totalTrips}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Viagens Concluídas</p>
                <p className="text-2xl font-bold text-green-600">{shiftStats.completedTrips}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">{shiftStats.pendingTrips}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Tempo Médio</p>
                <p className="text-2xl font-bold text-blue-600">{shiftStats.averageTime} min</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status dos Boxes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Status Final dos Boxes
            </CardTitle>
            <CardDescription>
              Verificação de fechamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm">Boxes Vazios</span>
                <span className="text-sm font-medium text-green-600">{boxStats.empty}/{boxStats.total}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm">Boxes Ocupados</span>
                <span className="text-sm font-medium text-yellow-600">{boxStats.occupied}/{boxStats.total}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm">Boxes com Pendências</span>
                <span className="text-sm font-medium text-red-600">{boxStats.pending}/{boxStats.total}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ocorrências */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Registro de Ocorrências
            </CardTitle>
            <CardDescription>
              Registre problemas ou situações relevantes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea 
              placeholder="Descreva aqui qualquer ocorrência ou observação importante do turno..."
              className="min-h-[120px]"
            />
          </CardContent>
        </Card>

        {/* Ações de Fechamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Confirmação de Fechamento
            </CardTitle>
            <CardDescription>
              Verifique os itens e confirme o fechamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">Boxes verificados e atualizados</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">Pendências documentadas</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">Ocorrências registradas</span>
              </label>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full">
              <Send className="mr-2 h-4 w-4" />
              Confirmar Fechamento do Turno
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ShiftClose; 