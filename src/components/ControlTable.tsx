
import React, { useState, useEffect } from 'react';
import { Plus, Trash, Filter, Download, Save, ArrowUp, ArrowDown, FileDown } from 'lucide-react';
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
  CardFooter,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";

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

interface ControlTableProps {
  onEntryChange?: (entries: ControlEntry[]) => void;
  tableTitle?: string;
}

const ControlTable = ({ 
  onEntryChange, 
  tableTitle = "Controle de Viagem" 
}: ControlTableProps) => {
  const { toast } = useToast();
  const [entries, setEntries] = useState<ControlEntry[]>([]);
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState<Partial<Record<keyof ControlEntry, string>>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof ControlEntry | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const itemsPerPage = 5;

  // Carregar dados do localStorage ao inicializar
  useEffect(() => {
    const savedEntries = localStorage.getItem('tableEntries');
    if (savedEntries) {
      try {
        const parsedEntries = JSON.parse(savedEntries);
        setEntries(parsedEntries);
      } catch (e) {
        console.error('Erro ao carregar dados da tabela:', e);
      }
    }
  }, []);

  // Salvar dados no localStorage quando houver mudanças
  useEffect(() => {
    localStorage.setItem('tableEntries', JSON.stringify(entries));
  }, [entries]);

  // Update parent component when entries change
  useEffect(() => {
    onEntryChange?.(entries);
  }, [entries, onEntryChange]);

  const handleAddEntry = () => {
    const newEntry: ControlEntry = {
      date: new Date().toLocaleDateString(),
      trip: "",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      oldTrip: "",
      preBox: "",
      boxInside: "",
      quantity: 0,
      shift: 1,
      cargoType: "Distribuição",
      region: "",
      status: "",
      manifestDate: new Date().toLocaleDateString(),
    };
    
    const updatedEntries = [...entries, newEntry];
    setEntries(updatedEntries);
    
    // Navegar para a última página ao adicionar um novo registro
    const lastPage = Math.ceil((updatedEntries.length) / itemsPerPage);
    setCurrentPage(lastPage);
    
    toast({
      title: "Registro adicionado",
      description: "Novo registro adicionado com sucesso.",
    });
  };

  const handleDeleteEntry = (index: number) => {
    const realIndex = getStartIndex() + index;
    const updatedEntries = entries.filter((_, i) => i !== realIndex);
    setEntries(updatedEntries);
    
    // Ajustar a página atual se necessário
    const lastPage = Math.ceil(updatedEntries.length / itemsPerPage);
    if (currentPage > lastPage && lastPage > 0) {
      setCurrentPage(lastPage);
    }
    
    toast({
      title: "Registro removido",
      description: "Registro removido com sucesso.",
    });
  };

  const handleEntryChange = (index: number, field: keyof ControlEntry, value: any) => {
    const realIndex = getStartIndex() + index;
    const updatedEntries = [...entries];
    updatedEntries[realIndex] = { ...updatedEntries[realIndex], [field]: value };
    setEntries(updatedEntries);
  };

  const handleFilterChange = (key: keyof ControlEntry, value: string) => {
    setFilters({ ...filters, [key]: value });
    setCurrentPage(1);  // Voltar para a primeira página ao filtrar
  };

  const handleSort = (field: keyof ControlEntry) => {
    if (sortField === field) {
      // Inverter direção se já estiver ordenando por este campo
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Novo campo de ordenação
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: keyof ControlEntry) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
  };

  const filteredEntries = entries.filter(entry => {
    return Object.entries(filters).every(([key, filterValue]) => {
      if (!filterValue) return true;
      const entryValue = String(entry[key as keyof ControlEntry]).toLowerCase();
      return entryValue.includes(filterValue.toLowerCase());
    });
  });
  
  // Aplicar ordenação
  const sortedEntries = [...filteredEntries].sort((a, b) => {
    if (!sortField) return 0;
    
    const valueA = String(a[sortField]).toLowerCase();
    const valueB = String(b[sortField]).toLowerCase();
    
    if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
    if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Paginação
  const totalPages = Math.ceil(sortedEntries.length / itemsPerPage);
  
  const getStartIndex = () => (currentPage - 1) * itemsPerPage;
  const getEndIndex = () => Math.min(getStartIndex() + itemsPerPage, sortedEntries.length);
  
  const paginatedEntries = sortedEntries.slice(getStartIndex(), getEndIndex());

  const statusOptions = [
    "1° TURNO OK",
    "2° TURNO OK",
    "3° TURNO OK"
  ];
  
  const exportToCSV = () => {
    // Preparar cabeçalhos
    const headers = Object.keys(entries[0] || {}).join(',');
    
    // Preparar dados
    const csvRows = entries.map(entry => {
      return Object.values(entry).map(value => {
        // Tratar valores que possam conter vírgulas
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value;
      }).join(',');
    });
    
    // Juntar tudo
    const csvContent = [headers, ...csvRows].join('\n');
    
    // Criar blob e link para download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `controle_viagem_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Exportação concluída",
      description: "Dados exportados com sucesso para CSV.",
    });
  };
  
  const saveData = () => {
    localStorage.setItem('tableEntries', JSON.stringify(entries));
    toast({
      title: "Dados salvos",
      description: "Dados da tabela foram salvos localmente.",
    });
  };

  return (
    <Card className="border rounded-lg bg-white shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-semibold">{tableTitle}</CardTitle>
        <div className="flex items-center space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={() => setShowFilter(!showFilter)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <Filter size={18} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Filtro avançado</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={handleAddEntry}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <Plus size={18} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Adicionar nova linha</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={saveData}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <Save size={18} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Salvar dados</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={exportToCSV}
                  className="p-2 hover:bg-gray-100 rounded-full"
                  disabled={entries.length === 0}
                >
                  <FileDown size={18} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Exportar para CSV</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ações</TableHead>
                {Object.keys(entries[0] || {
                  date: "", trip: "", time: "", oldTrip: "", preBox: "", 
                  boxInside: "", quantity: 0, shift: 0, cargoType: "", 
                  region: "", status: "", manifestDate: ""
                }).map((key) => (
                  <TableHead 
                    key={key} 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort(key as keyof ControlEntry)}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{key}</span>
                      {getSortIcon(key as keyof ControlEntry)}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
              {showFilter && (
                <TableRow>
                  <TableHead></TableHead>
                  {Object.keys(entries[0] || {
                    date: "", trip: "", time: "", oldTrip: "", preBox: "", 
                    boxInside: "", quantity: 0, shift: 0, cargoType: "", 
                    region: "", status: "", manifestDate: ""
                  }).map((key) => (
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
              {paginatedEntries.length > 0 ? (
                paginatedEntries.map((entry, index) => (
                  <TableRow key={index} className="group">
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => handleDeleteEntry(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash size={16} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Excluir linha</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    {Object.entries(entry).map(([key, value]) => {
                      if (key === 'status') {
                        return (
                          <TableCell key={key}>
                            <select
                              value={value}
                              onChange={(e) => handleEntryChange(index, key as keyof ControlEntry, e.target.value)}
                              className="w-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-2"
                            >
                              <option value="">Selecione</option>
                              {statusOptions.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </TableCell>
                        );
                      }
                      return (
                        <TableCell key={key}>
                          <input
                            type={typeof value === 'number' ? 'number' : 'text'}
                            value={value}
                            onChange={(e) => handleEntryChange(index, key as keyof ControlEntry, e.target.value)}
                            className="w-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-2"
                          />
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={Object.keys(entries[0] || {}).length + 1} className="text-center py-4 text-gray-500">
                    Nenhum registro encontrado. Adicione uma nova linha para começar.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      
      {totalPages > 1 && (
        <CardFooter className="flex justify-center pt-2 pb-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => 
                  page === 1 || 
                  page === totalPages || 
                  (page >= currentPage - 1 && page <= currentPage + 1)
                )
                .map((page, i, array) => {
                  // Adicionar elipses se houver lacunas na sequência
                  const showEllipsisBefore = i > 0 && array[i-1] !== page - 1;
                  const showEllipsisAfter = i < array.length - 1 && array[i+1] !== page + 1;
                  
                  return (
                    <React.Fragment key={page}>
                      {showEllipsisBefore && (
                        <PaginationItem>
                          <span className="flex h-9 w-9 items-center justify-center">...</span>
                        </PaginationItem>
                      )}
                      
                      <PaginationItem>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={page === currentPage}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                      
                      {showEllipsisAfter && (
                        <PaginationItem>
                          <span className="flex h-9 w-9 items-center justify-center">...</span>
                        </PaginationItem>
                      )}
                    </React.Fragment>
                  );
                })}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </CardFooter>
      )}
    </Card>
  );
};

export default ControlTable;
