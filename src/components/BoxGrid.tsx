import React, { useState, useEffect } from 'react';
import { AlertTriangle, Plus, Filter, Save, Edit, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { useToast } from "@/hooks/use-toast";
import { BoxData, BoxStatus, ControlEntry } from '@/types';
import { cn } from "@/lib/utils";
import { updateAllBoxes } from '@/lib/db';

interface BoxProps {
  id: string;
  trip: string;
  status: BoxStatus;
  onStatusChange: (newStatus: BoxStatus) => void;
  onDelete: () => void;
  editMode: boolean;
  tableEntries?: ControlEntry[];
}

export interface BoxGridProps {
  boxData: BoxData[];
  onBoxDataChange: (newBoxData: BoxData[]) => void;
  tableEntries: ControlEntry[];
  isEditable?: boolean;
  compact?: boolean;
}

const Box = ({ id, trip, status, onStatusChange, onDelete, editMode, tableEntries }: BoxProps) => {
  const { toast } = useToast();

  const getBackgroundColor = () => {
    const linkedTrip = tableEntries?.find(entry => entry.preBox === id && !entry.boxInside)?.trip;
    if (linkedTrip) {
      return cn(
        'bg-yellow-400 dark:bg-yellow-600',
        'text-black dark:text-black'
      );
    }

    switch (status) {
      case 'blocked':
        return cn(
          'bg-red-500 dark:bg-red-600',
          'text-white'
        );
      case 'free':
        return cn(
          'bg-green-400 dark:bg-green-600',
          'text-white'
        );
      case 'occupied':
        return cn(
          'bg-[#FEC6A1] dark:bg-orange-900/30',
          'dark:text-orange-100'
        );
    }
  };

  const displayValue = () => {
    const linkedTrip = tableEntries?.find(entry => entry.preBox === id && !entry.boxInside)?.trip;
    if (linkedTrip) {
      return linkedTrip.toUpperCase();
    }

    if (status === 'blocked') return 'BLOQUEADO';
    if (status === 'free') return '*LIVRE*';
    if (status === 'occupied' && trip) return trip.toUpperCase();
    return 'SEM VIAGEM';
  };

  const getStatusText = () => {
    const linkedTrip = tableEntries?.find(entry => entry.preBox === id && !entry.boxInside)?.trip;
    if (linkedTrip) {
      return `BOX COM VIAGEM ${linkedTrip.toUpperCase()} VINCULADA`;
    }

    switch (status) {
      case 'blocked':
        return 'BOX BLOQUEADO';
      case 'free':
        return 'BOX LIVRE PARA USO';
      case 'occupied':
        return trip ? `BOX OCUPADO COM A VIAGEM ${trip.toUpperCase()}` : 'BOX OCUPADO SEM VIAGEM';
    }
  };

  const handleClick = () => {
    if (!editMode) {
      toast({
        title: "MODO EDIÇÃO DESATIVADO",
        description: "Ative o modo de edição (ícone de lápis) para modificar os boxes.",
        duration: 3000,
      });
      return;
    }
    
    const nextStatus: Record<BoxStatus, BoxStatus> = {
      'occupied': 'free',
      'free': 'blocked',
      'blocked': 'occupied',
    };
    onStatusChange(nextStatus[status]);
  };

  return (
    <div className="relative group">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className={cn(
                "w-[70px] h-[60px] rounded-[8px]",
                getBackgroundColor(),
                "shadow-[rgba(50,50,93,0.25)_0px_30px_50px_-12px_inset,rgba(0,0,0,0.3)_0px_18px_26px_-18px_inset]",
                "transition-colors cursor-pointer p-2 flex flex-col justify-between m-0.5 relative"
              )}
              onClick={handleClick}
            >
              <div className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase">{id}</div>
              <div className="text-xs font-medium text-center truncate uppercase">{displayValue()}</div>
              {editMode && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Deseja realmente excluir o BOX ${id}?`)) {
                      onDelete();
                    }
                  }}
                  className={cn(
                    "absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1",
                    "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                    "hover:bg-red-600"
                  )}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{getStatusText()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default function BoxGrid({ boxData, onBoxDataChange, tableEntries, isEditable = false, compact = false }: BoxGridProps) {
  const { toast } = useToast();
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filterValue, setFilterValue] = useState('');
  const [isEditMode, setIsEditMode] = useState(isEditable);

  useEffect(() => {
    if (isEditMode) return;

    const updatedBoxData = boxData.map(box => {
      const relatedEntries = tableEntries.filter(entry => entry.preBox === box.id);
      
      if (relatedEntries.length === 0) {
        return { ...box, status: 'free' as BoxStatus, trip: '' };
      }

      const allEntriesHaveBoxD = relatedEntries.every(entry => entry.boxInside);
      
      if (allEntriesHaveBoxD) {
        return { ...box, status: 'free' as BoxStatus, trip: '' };
      } else {
        const activeEntry = relatedEntries.find(entry => !entry.boxInside);
        return {
          ...box,
          status: 'occupied' as BoxStatus,
          trip: activeEntry?.trip || ''
        };
      }
    });

    const hasChanges = updatedBoxData.some((box, index) => {
      return box.status !== boxData[index].status || box.trip !== boxData[index].trip;
    });

    if (hasChanges) {
      onBoxDataChange(updatedBoxData);
      localStorage.setItem('boxData', JSON.stringify(updatedBoxData));
    }
  }, [tableEntries, onBoxDataChange, boxData, isEditMode]);

  const handleStatusChange = (id: string, newStatus: BoxStatus) => {
    if (!isEditMode) return;

    const updatedBoxData = boxData.map(box => {
      if (box.id === id) {
        const newBox = {
          ...box,
          status: newStatus,
          trip: newStatus === 'free' || newStatus === 'blocked' ? '' : box.trip,
          lastUpdate: new Date().toISOString()
        };
        return newBox;
      }
      return box;
    });

    onBoxDataChange(updatedBoxData);
    localStorage.setItem('boxData', JSON.stringify(updatedBoxData));

    toast({
      title: "BOX ATUALIZADO",
      description: `O status do BOX ${id} foi alterado para ${
        newStatus === 'free' ? 'LIVRE' : 
        newStatus === 'blocked' ? 'BLOQUEADO' : 'OCUPADO'
      }.`,
      duration: 2000,
    });
  };

  const handleDelete = (id: string) => {
    const updatedBoxes = boxData.filter(box => box.id !== id);
    onBoxDataChange(updatedBoxes);
    localStorage.setItem('boxData', JSON.stringify(updatedBoxes));
  };

  const handleAddBox = () => {
    if (!isEditMode) return;

    const newBoxId = prompt("DIGITE O NÚMERO DO NOVO BOX:");
    if (!newBoxId) return;
    
    if (boxData.some(box => box.id.toLowerCase() === newBoxId.toLowerCase())) {
      toast({
        title: "ERRO AO ADICIONAR",
        description: "ESTE NÚMERO DE BOX JÁ EXISTE!",
        variant: "destructive",
      });
      return;
    }
    
    const newBox: BoxData = {
      id: newBoxId.toUpperCase(),
      trip: '',
      status: 'free',
      lastUpdate: new Date().toISOString()
    };

    const newBoxData = [...boxData, newBox];
    onBoxDataChange(newBoxData);
    localStorage.setItem('boxData', JSON.stringify(newBoxData));
    
    toast({
      title: "BOX ADICIONADO",
      description: `BOX ${newBoxId.toUpperCase()} FOI ADICIONADO COM SUCESSO.`,
    });
  };

  const handleSaveBoxState = async () => {
    try {
      await updateAllBoxes(boxData);
      localStorage.setItem('boxData', JSON.stringify(boxData));
      toast({
        title: "ESTADO SALVO",
        description: "ESTADO ATUAL DOS BOXES FOI SALVO COM SUCESSO.",
      });
    } catch (error) {
      console.error('Erro ao salvar estado:', error);
      toast({
        title: "ERRO AO SALVAR",
        description: "NÃO FOI POSSÍVEL SALVAR O ESTADO DOS BOXES.",
        variant: "destructive"
      });
    }
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
    toast({
      title: isEditMode ? "MODO EDIÇÃO DESATIVADO" : "MODO EDIÇÃO ATIVADO",
      description: isEditMode ? "SAINDO DO MODO DE EDIÇÃO DE PRÉ-BOX." : "AGORA VOCÊ PODE EDITAR OS PRÉ-BOXES.",
    });
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Controle de Pré-Box</CardTitle>
        <div className="flex gap-2">
          {isEditMode && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleAddBox}
                    className="p-2 hover:bg-gray-100 rounded-full dark:hover:bg-gray-800"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Adicionar Box</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setShowFilter(!showFilter)}
                  className="p-2 hover:bg-gray-100 rounded-full dark:hover:bg-gray-800"
                >
                  <Filter className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Filtrar Boxes</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleSaveBoxState}
                  className="p-2 hover:bg-gray-100 rounded-full dark:hover:bg-gray-800"
                >
                  <Save className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Salvar Estado</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleEditMode}
                  className={`p-2 hover:bg-gray-100 rounded-full dark:hover:bg-gray-800 ${
                    isEditMode ? 'bg-gray-200 dark:bg-gray-700' : ''
                  }`}
                >
                  <Edit className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Modo de Edição</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>

      <CardContent className="p-2">
        {showDuplicateWarning && (
          <Alert className="mb-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Atenção</AlertTitle>
            <AlertDescription>
              Foram detectados boxes duplicados. Por favor, verifique os dados da tabela.
            </AlertDescription>
          </Alert>
        )}

        {showFilter && (
          <div className="mb-2">
            <input
              type="text"
              placeholder="Filtrar boxes..."
              className="w-full p-2 border rounded"
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
            />
          </div>
        )}

        <div className="grid grid-cols-8 md:grid-cols-12 lg:grid-cols-16 gap-0.5">
          {boxData
            .filter(box => 
              !filterValue || 
              box.id.toLowerCase().includes(filterValue.toLowerCase()) ||
              box.trip.toLowerCase().includes(filterValue.toLowerCase())
            )
            .sort((a, b) => {
              const numA = parseInt((a.id || '').replace(/[^0-9]/g, '') || '0');
              const numB = parseInt((b.id || '').replace(/[^0-9]/g, '') || '0');
              return numA - numB;
            })
            .map((box) => (
              <Box
                key={box.id}
                id={box.id}
                trip={box.trip}
                status={box.status}
                onStatusChange={(newStatus) => handleStatusChange(box.id, newStatus)}
                onDelete={() => handleDelete(box.id)}
                editMode={isEditMode}
                tableEntries={tableEntries}
              />
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
