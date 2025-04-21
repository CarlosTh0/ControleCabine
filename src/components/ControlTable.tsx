import React, { useState, useEffect, useCallback, KeyboardEvent, useMemo } from 'react';
import { Plus, Filter, Download, Save, FileDown, Trash, Box, X } from 'lucide-react';
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
    manifestDate: new Date().toISOString().split('T')[0]
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit(formData);
      onClose();
    }
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
            onKeyDown={handleKeyDown}
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
            onKeyDown={handleKeyDown}
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
            onKeyDown={handleKeyDown}
            min={1}
            max={6}
            placeholder="Turno (1-6)"
            className="h-8"
          />
        </div>
        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => {
              onSubmit(formData);
              onClose();
            }}
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
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  
  const freeBoxes = boxData
    .filter(box => {
      // Box deve estar com status 'free'
      const isFree = box.status === 'free';
      // Box não deve estar vinculado a nenhuma viagem na tabela
      // OU deve estar em uma linha que já tem BOX-D preenchido
      const isNotLinked = !entries.some(entry => 
        entry.preBox === box.id && 
        entry.trip && 
        !entry.boxInside // Se tiver boxInside preenchido, o preBox está "livre" para uso
      );
      return isFree && isNotLinked;
    })
    .sort((a, b) => {
      const numA = parseInt(a.id);
      const numB = parseInt(b.id);
      return numA - numB;
    });

  return (
    <Card className="mb-4 bg-gray-50 dark:bg-gray-800">
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
              <PopoverContent className="w-64 p-0 shadow-lg z-[200]" sideOffset={5}>
                <QuickAddForm
                  boxId={box.id}
                  onSubmit={(data) => onQuickAdd(data)}
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

export interface ControlTableProps {
  entries: ControlEntry[];
  onEntriesChange: (newEntries: ControlEntry[]) => void;
  boxData: BoxData[];
  onBoxDataChange: (newBoxData: BoxData[]) => void;
  availablePreBoxes: string[];
  tableTitle?: string;
}

interface CellPosition {
  row: number;
  col: number;
}

export const ControlTable = ({ entries, onEntriesChange, boxData, onBoxDataChange, availablePreBoxes, tableTitle = "Controle de Viagem" }: ControlTableProps) => {
  const { toast } = useToast();
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState<Partial<Record<keyof ControlEntry, string>>>({});
  const [activeCell, setActiveCell] = useState<CellPosition | null>(null);
  const [selectedCells, setSelectedCells] = useState<CellPosition[]>([]);
  const [entryToAdd, setEntryToAdd] = useState<Partial<ControlEntry>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShift, setSelectedShift] = useState<string>('');
  const [addLinesOpen, setAddLinesOpen] = useState(false);

  // Definição das colunas e seus cabeçalhos
  const columnOrder: (keyof ControlEntry)[] = [
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
  ];

  const columnHeaders: Partial<Record<keyof ControlEntry, string>> = {
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

  const statusOptions = [
    "1° TURNO OK",
    "2° TURNO OK",
    "3° TURNO OK"
  ];
  
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      return Object.entries(entry).some(([key, value]) => {
        if (value === null || value === undefined) return false;
        const searchValue = searchTerm.toLowerCase();
        const entryValue = typeof value === 'number' ? value.toString() : value.toString().toLowerCase();
        return entryValue.includes(searchValue);
      });
    });
  }, [entries, searchTerm]);

  const handleAddEntry = () => {
    const newEntry: ControlEntry = {
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      manifestDate: new Date().toISOString().split('T')[0],
      trip: '',
      oldTrip: '',
      preBox: '',
      boxInside: '',
      quantity: '',
      shift: '',
      cargoType: '',
      region: '',
      status: ''
    };

    const updatedEntries = [...entries, newEntry];
    onEntriesChange(updatedEntries);
    localStorage.setItem('tableEntries', JSON.stringify(updatedEntries));
    
    toast({
      title: "Nova linha adicionada",
      description: "Uma linha vazia foi adicionada à tabela.",
      duration: 2000
    });
  };

  const handleDeleteEntry = (index: number) => {
    const updatedEntries = entries.filter((_, i) => i !== index);
    onEntriesChange(updatedEntries);
    toast({
      title: "Linha removida",
      description: "A linha foi removida com sucesso.",
      duration: 2000
    });
  };

  const handleUpdateEntry = (index: number, updates: Partial<ControlEntry>) => {
    const updatedEntries = entries.map((entry, i) => {
      if (i === index) {
        const updatedEntry = { ...entry, ...updates };
        // Garantir que campos numéricos sejam strings
        if ('preBox' in updates) updatedEntry.preBox = updates.preBox?.toString() || '';
        if ('quantity' in updates) updatedEntry.quantity = updates.quantity?.toString() || '';
        if ('shift' in updates) updatedEntry.shift = updates.shift?.toString() || '';
        return updatedEntry;
      }
      return entry;
    });
    
    onEntriesChange(updatedEntries);
    localStorage.setItem('tableEntries', JSON.stringify(updatedEntries));
  };

  // Função para salvar dados
  const handleSave = () => {
    try {
      onEntriesChange(entries);
      toast({
        title: "Alterações salvas",
        description: "Todas as alterações foram salvas com sucesso.",
        duration: 2000
      });
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive",
        duration: 3000
      });
    }
  };

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

  // Função para navegação entre células
  const handleCellKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement | HTMLSelectElement>, rowIndex: number, colIndex: number) => {
    const totalCols = columnOrder.length;
    const totalRows = entries.length;

    // Preencher hora atual
    const fillCurrentTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      handleUpdateEntry(rowIndex, { time: `${hours}:${minutes}` });
    };

    // Atalho Ctrl + '
    if (e.ctrlKey && e.key === "'") {
      e.preventDefault();
      fillCurrentTime();
      return;
    }

    const moveToCell = (newRow: number, newCol: number) => {
      if (newRow >= 0 && newRow < totalRows && newCol >= 0 && newCol < totalCols) {
        const element = document.querySelector(`[data-row="${newRow}"][data-col="${newCol}"] input, [data-row="${newRow}"][data-col="${newCol}"] select`) as HTMLElement;
        if (element) {
          element.focus();
          setActiveCell({ row: newRow, col: newCol });
          setSelectedCells([]);
        }
      }
    };

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (rowIndex > 0) moveToCell(rowIndex - 1, colIndex);
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (rowIndex < totalRows - 1) moveToCell(rowIndex + 1, colIndex);
        break;

      case 'ArrowLeft':
        e.preventDefault();
        if (colIndex > 0) moveToCell(rowIndex, colIndex - 1);
        else if (rowIndex > 0) moveToCell(rowIndex - 1, totalCols - 1);
        break;

      case 'ArrowRight':
        e.preventDefault();
        if (colIndex < totalCols - 1) moveToCell(rowIndex, colIndex + 1);
        else if (rowIndex < totalRows - 1) moveToCell(rowIndex + 1, 0);
        break;

      case 'Tab':
        e.preventDefault();
        if (e.shiftKey) {
          if (colIndex > 0) moveToCell(rowIndex, colIndex - 1);
          else if (rowIndex > 0) moveToCell(rowIndex - 1, totalCols - 1);
        } else {
          if (colIndex < totalCols - 1) moveToCell(rowIndex, colIndex + 1);
          else if (rowIndex < totalRows - 1) moveToCell(rowIndex + 1, 0);
        }
        handleSave();
        break;

      case 'Enter':
        e.preventDefault();
        if (colIndex < totalCols - 1) moveToCell(rowIndex, colIndex + 1);
        else if (rowIndex < totalRows - 1) moveToCell(rowIndex + 1, 0);
        handleSave();
        break;

      case 'Escape':
        e.preventDefault();
        setActiveCell(null);
        setSelectedCells([]);
        break;
    }
  }, [columnOrder.length, entries.length, handleSave]);

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
    const field = columnOrder[colIndex];
    
    if (field === 'preBox') {
      const updatedEntries = [...entries];
      updatedEntries[rowIndex] = { ...updatedEntries[rowIndex], preBox: pastedText };
      onEntriesChange(updatedEntries);
      localStorage.setItem('tableEntries', JSON.stringify(updatedEntries));
    } else {
      handleUpdateEntry(rowIndex, { [field]: pastedText.toUpperCase() });
    }
    handleSave();
  };

  const handleFreeBoxClick = (boxId: string) => {
    if (activeCell) {
      const { row: rowIndex } = activeCell;
      handleUpdateEntry(rowIndex, { preBox: boxId });
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

  const handleQuickAdd = (data: Partial<ControlEntry>) => {
    const newEntry: ControlEntry = {
      date: data.date || new Date().toISOString().split('T')[0],
      trip: data.trip || '',
      time: data.time || '',
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

    onEntriesChange([...entries, newEntry]);
    localStorage.setItem('tableEntries', JSON.stringify([...entries, newEntry]));
    
    toast({
      title: "LINHA ADICIONADA",
      description: `NOVA LINHA ADICIONADA COM PRÉ-BOX ${data.preBox}.`,
    });
  };

  return (
    <div>
      <FreeBoxes 
        boxData={boxData} 
        entries={entries} 
        onBoxClick={handleFreeBoxClick}
        onQuickAdd={handleQuickAdd}
      />
      <Card className="w-full shadow-lg border-0 overflow-x-auto">
        <div className="sticky top-0 z-[100] bg-white dark:bg-gray-900">
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
              }
              .table-content {
                width: 100%;
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
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b table-container">
              <div className="table-content">
                <div className="table-grid gap-4">
                  {columnOrder.map((key) => (
                    <div key={key} className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {columnHeaders[key]}
                      </label>
                      <Input
                            type="text"
                        placeholder={`Filtrar ${columnHeaders[key]}`}
                            value={filters[key] || ''}
                        onChange={(e) => setFilters(prev => ({ ...prev, [key]: e.target.value }))}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Cabeçalho da tabela */}
          <div className="bg-gray-100 dark:bg-gray-800 border-b table-container">
            <div className="table-content">
              <div className="table-grid">
                {columnOrder.map((key) => (
                  <div
                    key={key}
                    className="text-center p-2 font-bold border-r last:border-r-0 uppercase text-xs overflow-hidden text-ellipsis whitespace-nowrap"
                  >
                    {columnHeaders[key]}
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
        <CardContent className="p-0">
          <div className="overflow-y-auto table-container" style={{ maxHeight: "calc(100vh - 250px)" }}>
            <div className="table-content">
              {filteredEntries.map((entry, rowIndex) => (
                <div key={rowIndex} className="table-grid hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  {columnOrder.map((key, colIndex) => (
                    <div
                      key={`${rowIndex}-${key}`}
                      className={`p-0 border-b border-r ${
                        isCellSelected(rowIndex, colIndex) ? 'bg-blue-100 dark:bg-blue-900/30' : ''
                      }`}
                      onClick={(e) => handleCellClick(rowIndex, colIndex, e)}
                      data-row={rowIndex}
                      data-col={colIndex}
                    >
                      {key === 'status' ? (
                        <select
                          value={entry[key]}
                          onChange={(e) => handleUpdateEntry(rowIndex, { status: e.target.value })}
                          onKeyDown={(e) => handleCellKeyDown(e, rowIndex, colIndex)}
                          className="w-full h-full px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-transparent uppercase text-center text-sm"
                        >
                          <option value="">SELECIONE</option>
                          {statusOptions.map((option) => (
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
                                onChange={(e) => handleUpdateEntry(rowIndex, { [key]: e.target.value })}
                                onKeyDown={(e) => handleCellKeyDown(e, rowIndex, colIndex)}
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
                            handleUpdateEntry(rowIndex, { [key]: value });
                          }}
                          onKeyDown={(e) => handleCellKeyDown(e, rowIndex, colIndex)}
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
                              handleDeleteEntry(rowIndex);
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
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ControlTable;
