import { useState, useEffect, useCallback, useMemo, MouseEvent, ChangeEvent, ClipboardEvent } from 'react';
import type { KeyboardEvent } from 'react';
import { Plus, Filter, Download, Save, FileDown, Trash, Box, X, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ControlEntry, BoxData } from '@/types';
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

// Constantes
const STATUS_OPTIONS = [
  '1° COMPLETO',
  '1° INCOMPLETO',
  '2° COMPLETO',
  '2° INCOMPLETO',
  '3° COMPLETO',
  '3° INCOMPLETO'
] as const;

const COLUMN_ORDER = [
  'date',
  'trip',
  'time',
  'oldTrip',
  'preBox',
  'boxInside',
  'quantity',
  'shift',
  'cargoType',
  'region',
  'status',
  'manifestDate'
] as const;

const COLUMN_HEADERS: Record<typeof COLUMN_ORDER[number], string> = {
  date: "DATA",
  trip: "VIAGEM",
  time: "HORA",
  oldTrip: "VIAGEM ANTERIOR",
  preBox: "PRÉ-BOX",
  boxInside: "BOX-D",
  quantity: "QUANTIDADE",
  shift: "TURNO",
  cargoType: "TIPO DE CARGA",
  region: "REGIÃO",
  status: "STATUS",
  manifestDate: "DATA SEGUINTE"
};

interface FreeBoxesProps {
  boxData: BoxData[];
  entries: ControlEntry[];
  onBoxClick: (boxId: string) => void;
  onQuickAdd: (data: Partial<ControlEntry>) => void;
}

const QuickAddForm: React.FC<{
  boxId: string;
  onSubmit: (data: Partial<ControlEntry>) => void;
  onClose: () => void;
}> = ({ boxId, onSubmit, onClose }) => {
  const [formData, setFormData] = useState<Partial<ControlEntry>>({
    date: new Date().toISOString().split('T')[0],
    trip: '',
    time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    preBox: boxId,
    shift: '',
    manifestDate: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e: React.MouseEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold">Adicionar Viagem - Box {boxId}</h4>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-auto p-1">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium block mb-1">Viagem:</label>
          <Input
            value={formData.trip}
            onChange={(e) => setFormData(prev => ({ ...prev, trip: e.target.value.toUpperCase() }))}
            placeholder="Número da Viagem"
            className="h-8"
          />
        </div>
        <div>
          <label className="text-xs font-medium block mb-1">Quantidade:</label>
          <Input
            type="number"
            value={formData.quantity || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
            placeholder="Quantidade"
            className="h-8"
          />
        </div>
        <div>
          <label className="text-xs font-medium block mb-1">Turno:</label>
          <Input
            type="number"
            value={formData.shift || ''}
            onChange={(e) => {
              const value = Math.min(Math.max(parseInt(e.target.value) || 1, 1), 6);
              setFormData(prev => ({ ...prev, shift: value.toString() }));
            }}
            min={1}
            max={6}
            placeholder="Turno (1-6)"
            className="h-8"
          />
        </div>
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleSubmit}
            className="flex-1 h-8 bg-green-500 hover:bg-green-600 text-white text-xs"
          >
            Adicionar
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 h-8 text-xs"
          >
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
};

const FreeBoxes: React.FC<FreeBoxesProps> = ({ boxData, entries, onBoxClick, onQuickAdd }) => {
  const { toast } = useToast();
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  
  const handleAddNewEntry = (data: Partial<ControlEntry>) => {
    const newEntry: ControlEntry = {
      id: Date.now().toString(),
      date: data.date || new Date().toISOString().split('T')[0],
      trip: data.trip || '',
      time: data.time || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      oldTrip: '',
      preBox: data.preBox || '',
      boxInside: '',
      quantity: data.quantity?.toString() || '',
      shift: data.shift?.toString() || '1',
      cargoType: '',
      region: '',
      status: '',
      manifestDate: data.manifestDate || new Date().toISOString().split('T')[0]
    };
    
    onQuickAdd(newEntry);
    setOpenPopoverId(null);
  };

  const freeBoxes = boxData
    .filter(box => {
      const isFree = box.status === 'free';
      const isNotLinked = !entries.some(entry => 
        entry.preBox === box.id && 
        entry.trip && 
        !entry.boxInside
      );
      return isFree && isNotLinked;
    })
    .sort((a, b) => {
      const numA = parseInt(a.id);
      const numB = parseInt(b.id);
      return numA - numB;
    });

  return (
    <Card className="mb-4 bg-gray-50 dark:bg-gray-800 border-none shadow-none">
      <CardContent className="p-2">
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-sm font-semibold mr-2">Pré-boxes Livres:</span>
          {freeBoxes.map((box) => (
            <Popover key={box.id} open={openPopoverId === box.id} onOpenChange={(open) => setOpenPopoverId(open ? box.id : null)}>
              <PopoverTrigger asChild>
                <span
                  className="px-2 py-1 bg-green-400 dark:bg-green-600 text-white text-xs rounded-md cursor-pointer hover:bg-green-500 dark:hover:bg-green-700 transition-colors"
                >
                  {box.id}
                </span>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0 shadow-lg z-[200] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700" sideOffset={5}>
                <QuickAddForm
                  boxId={box.id}
                  onSubmit={handleAddNewEntry}
                  onClose={() => setOpenPopoverId(null)}
                />
              </PopoverContent>
            </Popover>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

interface CellPosition {
  row: number;
  col: number;
}

export interface ControlTableProps {
  entries: ControlEntry[];
  onEntriesChange: (newEntries: ControlEntry[]) => void;
  boxData: BoxData[];
  onBoxDataChange: (newBoxData: BoxData[]) => void;
  availablePreBoxes: string[];
  tableTitle?: string;
}

export const ControlTable = ({ 
  entries, 
  onEntriesChange, 
  boxData, 
  onBoxDataChange, 
  availablePreBoxes, 
  tableTitle = "Controle de Viagem" 
}: ControlTableProps) => {
  const { toast } = useToast();
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState<Partial<Record<keyof ControlEntry, string>>>({});
  const [activeCell, setActiveCell] = useState<CellPosition | null>(null);
  const [selectedCells, setSelectedCells] = useState<CellPosition[]>([]);

  // Função para adicionar nova linha
  const handleAddEntry = useCallback(() => {
    const newEntry: ControlEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      trip: '',
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      oldTrip: '',
      preBox: '',
      boxInside: '',
      quantity: '',
      shift: '',
      cargoType: '',
      region: '',
      status: '',
      manifestDate: new Date().toISOString().split('T')[0]
    };

    onEntriesChange([...entries, newEntry]);
    toast({
      title: "LINHA ADICIONADA",
      description: "Nova linha adicionada com sucesso.",
    });
  }, [entries, onEntriesChange, toast]);

  // Adicionar event listener para o atalho Ctrl+L
  useEffect(() => {
    const handleKeyDown = (e: Event) => {
      if (e instanceof KeyboardEvent && e.ctrlKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setShowFilter(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filtros e ordenação
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        const entryValue = entry[key as keyof ControlEntry];
        return entryValue?.toString().toLowerCase().includes(value.toLowerCase());
      });
    });
  }, [entries, filters]);

  // Handlers
  const handleSave = useCallback((e?: MouseEvent<HTMLButtonElement> | ChangeEvent<HTMLInputElement | HTMLSelectElement> | ClipboardEvent<Element>) => {
    if (!activeCell) return;
    
    const { row, col } = activeCell;
    const newEntries = [...entries];
    if (e && 'target' in e && e.target && 'value' in e.target) {
      newEntries[row] = {
        ...newEntries[row],
        [COLUMN_ORDER[col]]: e.target.value
      };
      onEntriesChange(newEntries);
      toast({
        title: "Sucesso",
        description: "Entrada atualizada com sucesso",
      });
    }
  }, [entries, activeCell, onEntriesChange, toast]);

  const handleDelete = useCallback((id: string) => {
    const newEntries = entries.filter(entry => entry.id !== id);
    onEntriesChange(newEntries);
    toast({
      title: "Sucesso",
      description: "Entrada removida com sucesso",
    });
  }, [entries, onEntriesChange, toast]);

  const handleStatusChange = useCallback((rowIndex: number, value: string) => {
    const newEntries = [...entries];
    newEntries[rowIndex] = {
      ...newEntries[rowIndex],
      status: value
    };
    onEntriesChange(newEntries);
  }, [entries, onEntriesChange]);

  // Navegação entre células
  const handleCellKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement | HTMLSelectElement>, rowIndex: number, colIndex: number) => {
    const totalCols = COLUMN_ORDER.length;
    const totalRows = entries.length;

    switch (e.key) {
      case 'Tab':
        e.preventDefault();
        if (e.shiftKey) {
          if (colIndex > 0) {
            setActiveCell({ row: rowIndex, col: colIndex - 1 });
          } else if (rowIndex > 0) {
            setActiveCell({ row: rowIndex - 1, col: totalCols - 1 });
          }
        } else {
          if (colIndex < totalCols - 1) {
            setActiveCell({ row: rowIndex, col: colIndex + 1 });
          } else if (rowIndex < totalRows - 1) {
            setActiveCell({ row: rowIndex + 1, col: 0 });
          }
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (rowIndex < totalRows - 1) {
          setActiveCell({ row: rowIndex + 1, col: colIndex });
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (rowIndex > 0) {
          setActiveCell({ row: rowIndex - 1, col: colIndex });
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (rowIndex < totalRows - 1) {
          setActiveCell({ row: rowIndex + 1, col: colIndex });
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (colIndex > 0) {
          setActiveCell({ row: rowIndex, col: colIndex - 1 });
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (colIndex < totalCols - 1) {
          setActiveCell({ row: rowIndex, col: colIndex + 1 });
        }
        break;
    }
  }, [COLUMN_ORDER.length, entries.length]);

  // Função para exportar para CSV
  const handleExportCSV = useCallback(() => {
    if (entries.length === 0) return;
    
    const headers = Object.keys(entries[0]).join(',');
    const csvRows = entries.map(entry => {
      return Object.values(entry).map(value => {
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(',');
    });
    
    const csvContent = [headers, ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${tableTitle}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "EXPORTAÇÃO CONCLUÍDA",
      description: "DADOS EXPORTADOS COM SUCESSO PARA CSV.",
    });
  }, [entries, tableTitle, toast]);

  // Função para selecionar células
  const handleCellClick = (rowIndex: number, colIndex: number, event: React.MouseEvent) => {
    if (event.ctrlKey) {
      setSelectedCells(prev => {
        const isSelected = prev.some(cell => cell.row === rowIndex && cell.col === colIndex);
        return isSelected
          ? prev.filter(cell => !(cell.row === rowIndex && cell.col === colIndex))
          : [...prev, { row: rowIndex, col: colIndex }];
      });
    } else {
      setSelectedCells([]);
      setActiveCell({ row: rowIndex, col: colIndex });
    }
  };

  // Função para verificar se célula está selecionada
  const isCellSelected = (rowIndex: number, colIndex: number) => {
    return selectedCells.some(cell => cell.row === rowIndex && cell.col === colIndex);
  };

  // Função para colar valores
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    if (!activeCell) return;
    
    const { row: rowIndex, col: colIndex } = activeCell;
    const field = COLUMN_ORDER[colIndex];
    
    if (field === 'preBox') {
      const updatedEntries = [...entries];
      updatedEntries[rowIndex] = { ...updatedEntries[rowIndex], preBox: pastedText };
      onEntriesChange(updatedEntries);
      localStorage.setItem('tableEntries', JSON.stringify(updatedEntries));
    } else {
      handleSave();
    }
  };

  const handleFreeBoxClick = (boxId: string) => {
    if (activeCell) {
      const { row: rowIndex } = activeCell;
      handleSave();
      toast({
        title: "PRÉ-BOX SELECIONADO",
        description: `PRÉ-BOX ${boxId} FOI SELECIONADO PARA A LINHA ${rowIndex + 1}.`,
      });
    } else {
      toast({
        title: "SELECIONE UMA LINHA",
        description: "CLIQUE EM UMA LINHA DA TABELA ANTES DE SELECIONAR UM PRÉ-BOX.",
        variant: "destructive",
      });
    }
  };

  // Função para verificar se um pré-box está disponível
  const isPreBoxAvailable = (box: string) => {
    return !entries.some(entry => entry.preBox === box && entry.trip);
  };

  // Função para obter a viagem vinculada a um pré-box
  const getTripForPreBox = (box: string) => {
    const entry = entries.find(e => e.preBox === box && e.trip);
    return entry ? entry.trip : null;
  };

  // Função para adicionar nova linha
  const handleQuickAdd = useCallback((newEntry: ControlEntry) => {
    onEntriesChange([...entries, newEntry]);
    toast({
      title: "LINHA ADICIONADA",
      description: `NOVA LINHA ADICIONADA COM PRÉ-BOX ${newEntry.preBox}.`,
    });
  }, [entries, onEntriesChange, toast]);

  const ROW_HEIGHT = 40; // Altura de cada linha em pixels

  const VirtualRow = useCallback(({ index, style, data }: { index: number; style: React.CSSProperties; data: any }) => {
    const { 
      entries, 
      COLUMN_ORDER, 
      handleCellKeyDown, 
      handleCellClick, 
      isCellSelected, 
      getTripForPreBox,
      handleDelete,
      STATUS_OPTIONS,
      handleStatusChange
    } = data;
    const entry = entries[index];

    return (
      <div style={style} className="table-grid hover:bg-gray-50 dark:hover:bg-gray-800/50">
        {COLUMN_ORDER.map((key: string, colIndex: number) => (
          <div
            key={`${index}-${key}`}
            className={`p-0 border-b border-r ${
              isCellSelected(index, colIndex) ? 'bg-blue-100 dark:bg-blue-900/30' : ''
            }`}
            onClick={(e) => handleCellClick(index, colIndex, e)}
            data-row={index}
            data-col={colIndex}
          >
            {key === 'status' ? (
              <select
                value={entry[key] || ''}
                onChange={(e) => handleStatusChange(index, e.target.value)}
                onKeyDown={(e) => handleCellKeyDown(e, index, colIndex)}
                className="w-full h-full px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-transparent uppercase text-center text-sm"
              >
                <option value="">SELECIONE</option>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : key === 'preBox' ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <input
                      type="text"
                      value={entry[key]}
                      onChange={(e) => handleSave()}
                      onKeyDown={(e) => handleCellKeyDown(e, index, colIndex)}
                      className="w-full h-full px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-transparent uppercase text-center text-sm"
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    {entry[key] && (
                      <p>
                        {getTripForPreBox(entry[key] as string)
                          ? `PRÉ-BOX vinculado à VIAGEM ${getTripForPreBox(entry[key] as string)}`
                          : 'PRÉ-BOX disponível'}
                      </p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <input
                type={key === 'quantity' || key === 'shift' ? 'number' : key === 'date' || key === 'manifestDate' ? 'date' : 'text'}
                value={entry[key]}
                onChange={(e) => {
                  let value = e.target.value;
                  if (key === 'shift' && value) {
                    value = Math.min(Math.max(parseInt(value) || 1, 1), 6).toString();
                  }
                  handleSave();
                }}
                onKeyDown={(e) => handleCellKeyDown(e, index, colIndex)}
                className="w-full h-full px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-transparent uppercase text-center text-sm"
                min={key === 'shift' ? 1 : undefined}
                max={key === 'shift' ? 6 : undefined}
                placeholder={key === 'time' ? "Ctrl+' = Hora atual" : ''}
              />
            )}
          </div>
        ))}
        <div className="p-0 border-b text-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(entries[index].id);
                  }}
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 h-[38px] w-[35px] p-0"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Excluir Linha</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    );
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <div className="sticky top-0 z-[100] bg-white dark:bg-gray-900">
        <FreeBoxes 
          boxData={boxData} 
          entries={entries} 
          onBoxClick={handleFreeBoxClick}
          onQuickAdd={handleQuickAdd}
        />
        <Card className="w-full shadow-lg border-none">
          <div className="bg-white dark:bg-gray-900">
            {/* Estilo para remover setas do input number */}
            <style>
              {`
                input[type="number"]::-webkit-inner-spin-button,
                input[type="number"]::-webkit-outer-spin-button {
                  -webkit-appearance: none;
                  margin: 0;
                }
                input[type="number"] {
                  -moz-appearance: textfield;
                }
                .table-container {
                  width: 100%;
                  overflow: hidden;
                  position: relative;
                  border: none;
                }
                .table-content {
                  width: 100%;
                  border: none;
                }
                .table-grid {
                  display: grid;
                  grid-template-columns: 
                    100px  /* DATA */
                    95px   /* VIAGEM */
                    75px   /* HORA */
                    115px  /* VIAGEM ANTERIOR */
                    75px   /* PRÉ-BOX */
                    75px   /* BOX-D */
                    95px   /* QUANTIDADE */
                    70px   /* TURNO */
                    125px  /* TIPO DE CARGA */
                    85px   /* REGIÃO */
                    105px  /* STATUS */
                    100px  /* DATA SEGUINTE */
                    40px;  /* AÇÕES */
                  gap: 0;
                  border: none;
                }
                .table-body {
                  max-height: calc(100vh - 280px);
                  overflow-y: auto;
                }
                .table-header {
                  position: sticky;
                  top: 0;
                  z-index: 10;
                  background-color: #f3f4f6;
                  border-bottom: 1px solid #e5e7eb;
                }
                .dark .table-header {
                  background-color: rgb(31 41 55);
                  border-bottom: 1px solid rgb(55 65 81);
                }
              `}
            </style>

            {/* Cabeçalho com título e botões */}
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 border-b">
              <CardTitle className="text-2xl font-bold">{tableTitle}</CardTitle>
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleAddEntry}
                        variant="outline"
                        size="icon"
                        className="bg-green-500 hover:bg-green-600 text-white"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Adicionar nova linha</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => setShowFilter(!showFilter)}
                        variant="outline"
                        size="icon"
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        <Filter className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Filtrar dados</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleSave}
                        variant="outline"
                        size="icon"
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Salvar alterações</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleExportCSV}
                        variant="outline"
                        size="icon"
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                      >
                        <FileDown className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Exportar dados</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardHeader>

            {/* Seção de filtros */}
            {showFilter && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b">
                <div className="max-w-sm mx-auto">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      VIAGEM/FROTA
                    </label>
                    <Input
                      type="text"
                      placeholder="Filtrar por viagem ou frota"
                      value={filters['trip'] || ''}
                      onChange={(e) => setFilters({ trip: e.target.value })}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Cabeçalho da tabela */}
            <div className="bg-gray-100 dark:bg-gray-800 border-b table-container sticky top-0 z-10">
              <div className="table-content">
                <div className="table-grid">
                  {COLUMN_ORDER.map((key) => (
                    <div
                      key={key}
                      className="text-center p-2 font-bold border-r last:border-r-0 uppercase text-xs overflow-hidden text-ellipsis whitespace-nowrap"
                    >
                      {COLUMN_HEADERS[key]}
                    </div>
                  ))}
                  <div className="text-center p-2 font-bold uppercase text-xs">
                    AÇÕES
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Corpo da tabela */}
          <CardContent className="p-0 table-body">
            <div className="table-container" style={{ height: 'calc(100vh - 280px)' }}>
              <AutoSizer>
                {({ height, width }) => (
                  <List
                    height={height}
                    width={width}
                    itemCount={filteredEntries.length}
                    itemSize={ROW_HEIGHT}
                    itemData={{
                      entries: filteredEntries,
                      COLUMN_ORDER,
                      handleCellKeyDown,
                      handleCellClick,
                      isCellSelected,
                      getTripForPreBox,
                      handleDelete,
                      STATUS_OPTIONS,
                      handleStatusChange
                    }}
                  >
                    {VirtualRow}
                  </List>
                )}
              </AutoSizer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ControlTable;
