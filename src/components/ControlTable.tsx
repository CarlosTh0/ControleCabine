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
import { supabase } from '@/lib/supabase';

interface ControlTableProps {
  entries: ControlEntry[];
  onEntriesChange: (entries: ControlEntry[]) => void;
  availablePreBoxes: number[];
  tableTitle: string;
  boxData?: BoxData[];
}

interface CellPosition {
  row: number;
  col: number;
}

export const ControlTable = ({ entries, onEntriesChange, availablePreBoxes, tableTitle, boxData }: ControlTableProps) => {
  const { toast } = useToast();
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState<Partial<Record<keyof ControlEntry, string>>>({});
  const [activeCell, setActiveCell] = useState<CellPosition | null>(null);
  const [selectedCells, setSelectedCells] = useState<CellPosition[]>([]);

  // Definição das colunas e seus cabeçalhos
  const columnOrder: (keyof ControlEntry)[] = [
    'date', 'trip', 'time', 'oldTrip', 'preBox', 
    'boxInside', 'quantity', 'shift', 'cargoType', 
    'region', 'status', 'manifestDate'
  ];

  const columnHeaders: Record<keyof ControlEntry, string> = {
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

  // Função para adicionar nova entrada
  const handleAddEntry = async () => {
    const newEntry: ControlEntry = {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      trip: '',
      quantity: 0,
      region: '',
      shift: 1,
      pre_box: 0,
      user_id: (await supabase.auth.getUser()).data.user?.id || ''
    };

    const { error } = await supabase
      .from('control_entries')
      .insert(newEntry);

    if (error) {
      console.error('Erro ao adicionar entrada:', error);
      return;
    }

    onEntriesChange([...entries, newEntry]);
  };

  // Função para excluir linha
  const handleDeleteEntry = async (id: string) => {
    const { error } = await supabase
      .from('control_entries')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar entrada:', error);
      return;
    }

    onEntriesChange(entries.filter(entry => entry.id !== id));
  };

  // Função para alterar valor da célula
  const handleUpdateEntry = async (id: string, field: keyof ControlEntry, value: any) => {
    const { error } = await supabase
      .from('control_entries')
      .update({ [field]: value })
      .eq('id', id);

    if (error) {
      console.error('Erro ao atualizar entrada:', error);
      return;
    }

    onEntriesChange(entries.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
  };

  // Função para salvar dados
  const handleSaveData = useCallback(() => {
    localStorage.setItem('tableEntries', JSON.stringify(entries));
    toast({
      title: "DADOS SALVOS",
      description: "DADOS DA TABELA FORAM SALVOS LOCALMENTE.",
    });
  }, [entries, toast]);

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
      handleUpdateEntry(entries[rowIndex].id, 'time', `${hours}:${minutes}`);
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
        handleSaveData();
        break;

      case 'Enter':
        e.preventDefault();
        if (colIndex < totalCols - 1) moveToCell(rowIndex, colIndex + 1);
        else if (rowIndex < totalRows - 1) moveToCell(rowIndex + 1, 0);
        handleSaveData();
        break;

      case 'Escape':
        e.preventDefault();
        setActiveCell(null);
        setSelectedCells([]);
        break;
    }
  }, [columnOrder.length, entries.length, handleSaveData]);

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
  const handlePaste = (rowIndex: number, colIndex: number, pastedText: string, field: keyof ControlEntry) => {
    if (selectedCells.length > 0) {
      const updatedEntries = [...entries];
      selectedCells.forEach(cell => {
        const fieldName = columnOrder[cell.col];
        updatedEntries[cell.row] = {
          ...updatedEntries[cell.row],
          [fieldName]: pastedText.toUpperCase()
        };
      });
      onEntriesChange(updatedEntries);
    } else {
      handleUpdateEntry(entries[rowIndex].id, field, pastedText.toUpperCase());
    }
    handleSaveData();
  };

  // Filtrar entradas baseado nos filtros
  const filteredEntries = entries.filter(entry => {
    return Object.entries(filters).every(([key, filterValue]) => {
      if (!filterValue) return true;
      const entryValue = String(entry[key as keyof ControlEntry]).toLowerCase();
      return entryValue.includes(filterValue.toLowerCase());
    });
  });

  return (
    <Card className="w-full shadow-lg border-0">
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
                  <p>Adicionar Linha</p>
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
                  <p>Filtrar Dados</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleSaveData}
                    variant="outline"
                    size="icon"
                    className="bg-purple-500 hover:bg-purple-600 text-white"
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Salvar Dados</p>
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
                  <p>Exportar para CSV</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>

        {/* Seção de PRÉ-BOX livres */}
        {tableTitle === "CONTROLE DE VIAGEM" && (
          <div className="bg-gray-50 dark:bg-gray-800/50 border-b">
            <div className="flex items-center gap-2 p-2">
              <Box className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">PRÉ-BOX LIVRES:</span>
              <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
                {availablePreBoxes.map((box) => (
                  <div
                    key={box}
                    className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md text-xs font-medium group relative"
                  >
                    {box}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateEntry(entries.find(e => e.preBox === box)?.id || '', 'preBox', '');
                      }}
                      className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Seção de filtros */}
        {showFilter && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b">
            <div className="grid grid-cols-6 gap-4">
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
        )}

        {/* Cabeçalho da tabela */}
        <div className="bg-gray-100 dark:bg-gray-800 border-b">
          <div className="grid grid-cols-[120px,100px,80px,120px,100px,80px,100px,80px,120px,80px,120px,120px,35px] gap-0">
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

      {/* Corpo da tabela */}
      <CardContent className="p-0">
        <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 250px)" }}>
          <div className="min-w-full">
            {filteredEntries.map((entry, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-[120px,100px,80px,120px,100px,80px,100px,80px,120px,80px,120px,120px,35px] gap-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
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
                        onChange={(e) => handleUpdateEntry(entry.id, key, e.target.value)}
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
                              onChange={(e) => handleUpdateEntry(entry.id, key, e.target.value)}
                              onKeyDown={(e) => handleCellKeyDown(e, rowIndex, colIndex)}
                              className="w-full h-full px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-transparent uppercase text-center text-sm"
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            {entry[key] && (
                              <p>
                                {entries.find(e => e.preBox === entry[key] && e.trip && e !== entry)
                                  ? `PRÉ-BOX vinculado à VIAGEM ${entries.find(e => e.preBox === entry[key] && e.trip && e !== entry)?.trip}`
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
                          if (key === 'shift') {
                            value = Math.min(Math.max(parseInt(value) || 1, 1), 6).toString();
                          }
                          handleUpdateEntry(entry.id, key, key === 'shift' ? parseInt(value) : value);
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
                            handleDeleteEntry(entry.id);
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
  );
};

export default ControlTable;
