import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { ControlEntry, BoxData } from '@/types';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from 'lucide-react';

interface DashboardProps {
  tableEntries: ControlEntry[];
  boxData: BoxData[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Dashboard: React.FC<DashboardProps> = ({ tableEntries, boxData }) => {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const filteredEntries = useMemo(() => {
    if (!startDate && !endDate) return tableEntries;
    
    return tableEntries.filter(entry => {
      const entryDate = entry.date;
      return (!startDate || entryDate >= startDate) && (!endDate || entryDate <= endDate);
    });
  }, [tableEntries, startDate, endDate]);

  // Cálculo de métricas
  const totalBoxes = boxData.length;
  const occupiedBoxes = boxData.filter(box => box.status === 'occupied').length;
  const freeBoxes = boxData.filter(box => box.status === 'free').length;
  const blockedBoxes = boxData.filter(box => box.status === 'blocked').length;

  // Média de quantidade por viagem
  const averageQuantityPerTrip = filteredEntries.length > 0
    ? (filteredEntries.reduce((acc, entry) => {
        const quantity = typeof entry.quantity === 'string' ? parseFloat(entry.quantity) || 0 : entry.quantity;
        return acc + quantity;
      }, 0) / filteredEntries.length).toFixed(2)
    : '0';

  // Dados para o gráfico de distribuição por região
  const regionDistribution = filteredEntries.reduce((acc: { [key: string]: number }, entry) => {
    if (entry.region) {
      acc[entry.region] = (acc[entry.region] || 0) + 1;
    }
    return acc;
  }, {});

  const regionChartData = Object.entries(regionDistribution).map(([name, value]) => ({
    name: name || 'Sem Região',
    value
  }));

  // Dados para o gráfico de viagens por turno
  const tripsByShift = filteredEntries.reduce((acc: { [key: string]: number }, entry) => {
    const shiftNum = typeof entry.shift === 'string' ? parseInt(entry.shift) || 1 : entry.shift;
    const shift = `${shiftNum}º Turno`;
    acc[shift] = (acc[shift] || 0) + 1;
    return acc;
  }, {});

  const shiftChartData = [
    { name: '1º Turno', Quantidade: tripsByShift['1º Turno'] || 0 },
    { name: '2º Turno', Quantidade: tripsByShift['2º Turno'] || 0 },
    { name: '3º Turno', Quantidade: tripsByShift['3º Turno'] || 0 },
    { name: '4º Turno', Quantidade: tripsByShift['4º Turno'] || 0 },
    { name: '5º Turno', Quantidade: tripsByShift['5º Turno'] || 0 },
    { name: '6º Turno', Quantidade: tripsByShift['6º Turno'] || 0 }
  ];

  return (
    <div className="space-y-4">
      {/* Filtro de Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filtro por Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Data Inicial</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Data Final</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
              >
                Limpar Filtro
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Boxes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBoxes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Boxes Ocupados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{occupiedBoxes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Boxes Livres</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{freeBoxes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Boxes Bloqueados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{blockedBoxes}</div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Região</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={regionChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {regionChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Viagens por Turno</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shiftChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Quantidade" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard; 