
import React, { useState } from 'react';
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

const ControlTable = () => {
  const initialEntries: ControlEntry[] = [
    {
      date: "01/02/2025",
      trip: "AUTOPORT",
      time: "6:06",
      oldTrip: "",
      km: "",
      fleet: "",
      preBox: "",
      boxInside: "AP1",
      quantity: 11,
      shift: 1,
      cargoType: "Distribuição",
      region: "AP",
      status: "",
      exchange: "",
      manifestDate: "01/02/2025",
      scheduled: "",
    },
    {
      date: "01/02/2025",
      trip: "AUTOPORT",
      time: "6:06",
      oldTrip: "",
      km: "",
      fleet: "",
      preBox: "",
      boxInside: "AP2",
      quantity: 11,
      shift: 1,
      cargoType: "Distribuição",
      region: "AP",
      status: "",
      exchange: "",
      manifestDate: "01/02/2025",
      scheduled: "",
    },
    {
      date: "01/02/2025",
      trip: "AUTOPORT",
      time: "6:06",
      oldTrip: "",
      km: "",
      fleet: "",
      preBox: "",
      boxInside: "AP3",
      quantity: 11,
      shift: 1,
      cargoType: "Distribuição",
      region: "AP",
      status: "",
      exchange: "",
      manifestDate: "01/02/2025",
      scheduled: "",
    },
    {
      date: "01/02/2025",
      trip: "508938",
      time: "7:34",
      oldTrip: "",
      km: "",
      fleet: "",
      preBox: "331",
      boxInside: "6",
      quantity: 11,
      shift: 1,
      cargoType: "Distribuição",
      region: "S",
      status: "",
      exchange: "",
      manifestDate: "01/02/2025",
      scheduled: "",
    },
  ];

  const [entries, setEntries] = useState<ControlEntry[]>(initialEntries);
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
    
    setEntries([...entries, newEntry]);
  };

  const handleDeleteEntry = (index: number) => {
    const newEntries = [...entries];
    newEntries.splice(index, 1);
    setEntries(newEntries);
  };

  const handleFilterChange = (key: keyof ControlEntry, value: string) => {
    setFilters({
      ...filters,
      [key]: value,
    });
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
                  {Object.keys(initialEntries[0]).map((key) => (
                    <TableHead key={key}>
                      <input
                        type="text"
                        placeholder={`Filtrar ${key}...`}
                        className="w-full p-1 text-xs border rounded"
                        value={filters[key as keyof ControlEntry] || ''}
                        onChange={(e) => handleFilterChange(key as keyof ControlEntry, e.target.value)}
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
                  <TableCell>{entry.date}</TableCell>
                  <TableCell>{entry.trip}</TableCell>
                  <TableCell>{entry.time}</TableCell>
                  <TableCell>{entry.oldTrip}</TableCell>
                  <TableCell>{entry.km}</TableCell>
                  <TableCell>{entry.fleet}</TableCell>
                  <TableCell>{entry.preBox}</TableCell>
                  <TableCell>{entry.boxInside}</TableCell>
                  <TableCell>{entry.quantity}</TableCell>
                  <TableCell>{entry.shift}</TableCell>
                  <TableCell>{entry.cargoType}</TableCell>
                  <TableCell>{entry.region}</TableCell>
                  <TableCell>{entry.status}</TableCell>
                  <TableCell>{entry.exchange}</TableCell>
                  <TableCell>{entry.manifestDate}</TableCell>
                  <TableCell>{entry.scheduled}</TableCell>
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
