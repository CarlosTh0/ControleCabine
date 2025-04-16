import React, { useState, useEffect } from 'react';
import { Plus, Trash, Filter } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ControlEntry {
  date: string;
  trip: string;
  time: string;
  oldTrip: string;
  km: string;
  fleet: string;
  preBox: string;
  boxInside: string;
  quantity: number;
  shift: number;
  cargoType: string;
  region: string;
  status: string;
  exchange: string;
  manifestDate: string;
  scheduled: string;
}

interface ControlTableProps {
  onEntryChange?: (entries: ControlEntry[]) => void;
}

const ControlTable = ({ onEntryChange }: ControlTableProps) => {
  const [entries, setEntries] = useState<ControlEntry[]>([]);
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState<Partial<Record<keyof ControlEntry, string>>>({});

  const handleAddEntry = () => {
    const newEntry: ControlEntry = {
      date: new Date().toLocaleDateString(),
      trip: "",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      oldTrip: "",
      km: "",
      fleet: "",
      preBox: "",
      boxInside: "",
      quantity: 0,
      shift: 1,
      cargoType: "Distribuição",
      region: "",
      status: "",
      exchange: "",
      manifestDate: new Date().toLocaleDateString(),
      scheduled: "",
    };
    
    const updatedEntries = [...entries, newEntry];
    setEntries(updatedEntries);
    onEntryChange?.(updatedEntries);
  };

  const handleDeleteEntry = (index: number) => {
    const updatedEntries = entries.filter((_, i) => i !== index);
    setEntries(updatedEntries);
    onEntryChange?.(updatedEntries);
  };

  const handleEntryChange = (index: number, field: keyof ControlEntry, value: any) => {
    const updatedEntries = [...entries];
    updatedEntries[index] = { ...updatedEntries[index], [field]: value };
    setEntries(updatedEntries);
    onEntryChange?.(updatedEntries);
  };

  const filteredEntries = entries.filter(entry => {
    return Object.entries(filters).every(([key, filterValue]) => {
      if (!filterValue) return true;
      const entryValue = String(entry[key as keyof ControlEntry]).toLowerCase();
      return entryValue.includes(filterValue.toLowerCase());
    });
  });

  return (
    <Card className="border rounded-lg bg-white shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-semibold">Controle de Pré-Box</CardTitle>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setShowFilter(!showFilter)}
            className="p-2 hover:bg-gray-100 rounded-full"
            title="Filtro avançado"
          >
            <Filter size={18} />
          </button>
          <button 
            onClick={handleAddEntry}
            className="p-2 hover:bg-gray-100 rounded-full"
            title="Adicionar nova linha"
          >
            <Plus size={18} />
          </button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ações</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Viagem</TableHead>
                <TableHead>Horas</TableHead>
                <TableHead>Viagem Antiga</TableHead>
                <TableHead>KM</TableHead>
                <TableHead>Frota</TableHead>
                <TableHead>Pré Box</TableHead>
                <TableHead>Box Dentro</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Turno</TableHead>
                <TableHead>Tipo de Carga</TableHead>
                <TableHead>Região</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead>Troca</TableHead>
                <TableHead>Data Prev. Manifesto</TableHead>
                <TableHead>Agendada</TableHead>
              </TableRow>
              {showFilter && (
                <TableRow>
                  <TableHead></TableHead>
                  {Object.keys(entries[0] || {}).map((key) => (
                    <TableHead key={key}>
                      <input
                        type="text"
                        placeholder={`Filtrar ${key}...`}
                        className="w-full p-1 text-xs border rounded"
                        value={filters[key as keyof ControlEntry] || ''}
                        onChange={(e) => {
                          handleFilterChange(key as keyof ControlEntry, e.target.value)
                        }}
                      />
                    </TableHead>
                  ))}
                </TableRow>
              )}
            </TableHeader>
            <TableBody>
              {filteredEntries.map((entry, index) => (
                <TableRow key={index} className="group">
                  <TableCell>
                    <button
                      onClick={() => handleDeleteEntry(index)}
                      className="invisible group-hover:visible text-red-500 hover:text-red-700"
                      title="Excluir linha"
                    >
                      <Trash size={16} />
                    </button>
                  </TableCell>
                  {Object.entries(entry).map(([key, value]) => (
                    <TableCell key={key}>
                      <input
                        type={typeof value === 'number' ? 'number' : 'text'}
                        value={value}
                        onChange={(e) => handleEntryChange(index, key as keyof ControlEntry, e.target.value)}
                        className="w-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-2"
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ControlTable;
