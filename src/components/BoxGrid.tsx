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
import { supabase } from '@/lib/supabase';
import { Button } from "@/components/ui/button";

interface BoxProps {
  id: string;
  trip: string;
  status: BoxStatus;
  onStatusChange: (newStatus: BoxStatus) => void;
}

interface BoxGridProps {
  tableEntries: ControlEntry[];
  onBoxDataChange: (boxData: BoxData[]) => void;
  initialBoxData?: BoxData[];
}

const Box = ({ id, trip, status, onStatusChange, onDelete, editMode }: BoxProps & { onDelete: () => void, editMode: boolean }) => {
  const { toast } = useToast();

  const getBackgroundColor = () => {
    switch (status) {
      case 'blocked' as BoxStatus:
        return 'bg-red-500 text-white dark:bg-red-600';
      case 'free' as BoxStatus:
        return 'bg-green-400 dark:bg-green-600 text-white';
      case 'occupied' as BoxStatus:
        return 'bg-[#FEC6A1] dark:bg-orange-900/30 dark:text-orange-100';
    }
  };

  const displayValue = () => {
    if (status === 'blocked' as BoxStatus) return 'BLOQUEADO';
    if (status === 'free' as BoxStatus) return '*LIVRE*';
    return trip.toUpperCase();
  };

  const getStatusText = () => {
    switch (status) {
      case 'blocked' as BoxStatus:
        return 'BOX BLOQUEADO';
      case 'free' as BoxStatus:
        return 'BOX LIVRE PARA USO';
      case 'occupied' as BoxStatus:
        return `BOX OCUPADO COM A VIAGEM ${trip.toUpperCase()}`;
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
      'occupied': 'free' as BoxStatus,
      'free': 'blocked' as BoxStatus,
      'blocked': 'occupied' as BoxStatus,
    };
    onStatusChange(nextStatus[status]);
  };

  return (
    <div className="relative group">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className={`w-[70px] h-[60px] rounded-[8px] ${getBackgroundColor()} 
                        shadow-[rgba(50,50,93,0.25)_0px_30px_50px_-12px_inset,rgba(0,0,0,0.3)_0px_18px_26px_-18px_inset] 
                        transition-colors cursor-pointer p-2 flex flex-col justify-between m-0.5 relative`}
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
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="uppercase">{getStatusText()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export const BoxGrid = ({ tableEntries, onBoxDataChange, initialBoxData = [] }: BoxGridProps) => {
  const { toast } = useToast();
  const [boxData, setBoxData] = useState<BoxData[]>(initialBoxData);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filterValue, setFilterValue] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    const loadBoxData = async () => {
      const { data, error } = await supabase
        .from('box_data')
        .select('*')
        .order('id');

      if (error) {
        console.error('Erro ao carregar boxes:', error);
        return;
      }

      if (data && data.length > 0) {
        setBoxData(data);
        onBoxDataChange(data);
      } else if (initialBoxData.length > 0) {
        // Inserir dados iniciais se não houver dados no banco
        const { error: insertError } = await supabase
          .from('box_data')
          .insert(initialBoxData);

        if (insertError) {
          console.error('Erro ao inserir boxes iniciais:', insertError);
          return;
        }

        setBoxData(initialBoxData);
        onBoxDataChange(initialBoxData);
      }
    };

    loadBoxData();
  }, [initialBoxData, onBoxDataChange]);

  const handleStatusChange = async (id: string, newStatus: BoxData['status']) => {
    const { error } = await supabase
      .from('box_data')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      console.error('Erro ao atualizar status do box:', error);
      return;
    }

    const updatedBoxData = boxData.map(box => 
      box.id === id ? { ...box, status: newStatus } : box
    );

    setBoxData(updatedBoxData);
    onBoxDataChange(updatedBoxData);
  };

  const handleDeleteBox = async (id: string) => {
    const { error } = await supabase
      .from('box_data')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar box:', error);
      return;
    }

    const updatedBoxData = boxData.filter(box => box.id !== id);
    setBoxData(updatedBoxData);
    onBoxDataChange(updatedBoxData);
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
      status: 'free' as BoxStatus,
      lastUpdate: new Date().toISOString()
    };

    const newBoxData = [...boxData, newBox];
    setBoxData(newBoxData);
    onBoxDataChange(newBoxData);
    
    toast({
      title: "BOX ADICIONADO",
      description: `BOX ${newBoxId.toUpperCase()} FOI ADICIONADO COM SUCESSO.`,
    });
  };

  const handleSaveBoxState = () => {
    onBoxDataChange(boxData);
    toast({
      title: "ESTADO SALVO",
      description: "ESTADO ATUAL DOS BOXES FOI SALVO COM SUCESSO.",
    });
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
            .map((box, index) => (
              <Box
                key={`${box.id}-${index}`}
                id={box.id}
                trip={box.trip}
                status={box.status}
                onStatusChange={(newStatus) => handleStatusChange(box.id, newStatus)}
                onDelete={() => handleDeleteBox(box.id)}
                editMode={isEditMode}
              />
            ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default BoxGrid;
