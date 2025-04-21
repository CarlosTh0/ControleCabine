import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Download, FileSpreadsheet, FileText, BarChart } from 'lucide-react';
import { addDays } from 'date-fns';
import { BoxData, ControlEntry } from '@/types';

interface ReportsProps {
  boxData: BoxData[];
  tableEntries: ControlEntry[];
}

const Reports: React.FC<ReportsProps> = ({ boxData, tableEntries }) => {
  const [dateRange, setDateRange] = React.useState({
    from: new Date(),
    to: addDays(new Date(), 7),
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Relatórios</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Relatório de Viagens */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Relatório de Viagens
            </CardTitle>
            <CardDescription>
              Exportar dados de viagens por período
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <DatePickerWithRange />
            <Select defaultValue="detailed">
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="detailed">Detalhado</SelectItem>
                <SelectItem value="summary">Resumido</SelectItem>
              </SelectContent>
            </Select>
            <Button className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Exportar Excel
            </Button>
          </CardContent>
        </Card>

        {/* Relatório de Ocupação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Relatório de Ocupação
            </CardTitle>
            <CardDescription>
              Análise de ocupação dos boxes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <DatePickerWithRange />
            <Select defaultValue="hourly">
              <SelectTrigger>
                <SelectValue placeholder="Selecione o intervalo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Por Hora</SelectItem>
                <SelectItem value="daily">Diário</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
              </SelectContent>
            </Select>
            <Button className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Gerar Relatório
            </Button>
          </CardContent>
        </Card>

        {/* Relatório de Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Relatório de Performance
            </CardTitle>
            <CardDescription>
              Métricas de desempenho e tempos médios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <DatePickerWithRange />
            <Select defaultValue="all">
              <SelectTrigger>
                <SelectValue placeholder="Selecione as métricas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Métricas</SelectItem>
                <SelectItem value="time">Tempos de Carregamento</SelectItem>
                <SelectItem value="efficiency">Eficiência</SelectItem>
              </SelectContent>
            </Select>
            <Button className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Exportar PDF
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports; 