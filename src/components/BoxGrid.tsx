
import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Plus, 
  Trash, 
  Filter,
  Download,
  Save,
  Edit,
  Trash2,
} from 'lucide-react';
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

type BoxStatus = 'blocked' | 'free' | 'occupied';

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

interface BoxProps {
  number: string;
  value: string;
  status: BoxStatus;
  onStatusChange: (newStatus: BoxStatus) => void;
  onDelete: () => void;
}

interface BoxGridProps {
  tableEntries: ControlEntry[];
}

const Box = ({ number, value, status, onStatusChange, onDelete }: BoxProps) => {
  const getBackgroundColor = () => {
    switch (status) {
      case 'blocked':
        return 'bg-red-500 text-white';
      case 'free':
        return 'bg-green-50';
      case 'occupied':
        return 'bg-[#FEC6A1]';
    }
  };

  const displayValue = () => {
    if (status === 'blocked') return 'BLOQUEADO';
    if (status === 'free') return '*LIVRE*';
    return value.toUpperCase();
  };

  const getStatusText = () => {
    switch (status) {
      case 'blocked':
        return 'BOX BLOQUEADO';
      case 'free':
        return 'BOX LIVRE PARA USO';
      case 'occupied':
        return `BOX OCUPADO COM A VIAGEM ${value.toUpperCase()}`;
    }
  };

  const handleClick = () => {
    // Cycle through statuses: occupied -> free -> blocked -> occupied
    const nextStatus: Record<BoxStatus, BoxStatus> = {
      'occupied': 'free',
      'free': 'blocked',
      'blocked': 'occupied'
    };
    onStatusChange(nextStatus[status]);
  };

  return (
    <div className="group relative">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className={`w-[100px] h-[80px] rounded-[20px] ${getBackgroundColor()} 
                        shadow-[rgba(50,50,93,0.25)_0px_30px_50px_-12px_inset,rgba(0,0,0,0.3)_0px_18px_26px_-18px_inset] 
                        transition-colors cursor-pointer p-3 flex flex-col justify-between`}
              onClick={handleClick}
            >
              <div className="text-xs font-semibold text-gray-600 uppercase">{number}</div>
              <div className="text-sm font-medium text-center truncate uppercase">{displayValue()}</div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="uppercase">{getStatusText()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <button 
        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hidden group-hover:block"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <Trash size={14} />
      </button>
    </div>
  );
};

const BoxGrid = ({ tableEntries }: BoxGridProps) => {
  const { toast } = useToast();
  // Generate box numbers according to specification: 50-56 and 300-356
  const generateBoxNumbers = () => {
    const boxes = [];
    
    // Numbers 50-56
    for (let i = 50; i <= 56; i++) {
      boxes.push(i.toString());
    }
    
    // Numbers 300-356
    for (let i = 300; i <= 356; i++) {
      boxes.push(i.toString());
    }
    
    // Additional special boxes from the example
    const specialBoxes = [
      "49", "GALPAO L", "MF1", "P1", "P2", "P3", "P4", 
      "6H1", "6H2", "2D3", "2D4", "2D5", "2D6", "2D7", 
      "2D8", "2D9", "2D10", "1", "1"
    ];
    
    boxes.push(...specialBoxes);
    
    return boxes;
  };

  // Load box data from local storage or initialize
  const loadBoxDataFromStorage = () => {
    try {
      const savedData = localStorage.getItem('boxData');
      if (savedData) {
        return JSON.parse(savedData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
    
    // Default initialization if no storage data
    return generateBoxNumbers().map(number => {
      return { number, value: '', status: 'free' as BoxStatus };
    });
  };

  const [boxData, setBoxData] = useState(loadBoxDataFromStorage());
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filterValue, setFilterValue] = useState('');
  const [editMode, setEditMode] = useState(false);
  
  // Save box data to local storage when it changes
  useEffect(() => {
    try {
      localStorage.setItem('boxData', JSON.stringify(boxData));
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
    }
  }, [boxData]);
  
  // Update box data based on table entries
  useEffect(() => {
    if (!tableEntries || tableEntries.length === 0) return;
    
    const newBoxData = [...boxData];
    const boxMap = new Map();
    
    // Reset all boxes to default state first
    newBoxData.forEach(box => {
      if (box.status !== 'blocked') {
        box.value = '';
        box.status = 'free';
      }
    });
    
    // Then update with table data
    tableEntries.forEach(entry => {
      if (entry.preBox) {
        // Check for duplicate values (same trip in multiple boxes)
        if (entry.trip && boxMap.has(entry.trip)) {
          setShowDuplicateWarning(true);
        } else if (entry.trip) {
          boxMap.set(entry.trip, entry.preBox);
        }
        
        // Find and update the box
        const boxIndex = newBoxData.findIndex(box => box.number.toLowerCase() === entry.preBox.toLowerCase());
        if (boxIndex !== -1 && newBoxData[boxIndex].status !== 'blocked') {
          newBoxData[boxIndex].value = entry.trip;
          newBoxData[boxIndex].status = entry.trip ? 'occupied' : 'free';
        }
      }
    });
    
    setBoxData(newBoxData);
  }, [tableEntries]);

  // Check for duplicate values
  React.useEffect(() => {
    const occupiedBoxes = boxData.filter(box => box.status === 'occupied' && box.value);
    const valueMap: Record<string, number> = {};
    
    occupiedBoxes.forEach(box => {
      if (box.value in valueMap) {
        valueMap[box.value]++;
      } else {
        valueMap[box.value] = 1;
      }
    });
    
    const hasDuplicates = Object.values(valueMap).some(count => count > 1);
    setShowDuplicateWarning(hasDuplicates);
  }, [boxData]);

  const handleStatusChange = (index: number, newStatus: BoxStatus) => {
    const newBoxData = [...boxData];
    newBoxData[index].status = newStatus;
    setBoxData(newBoxData);
    
    toast({
      title: "STATUS ATUALIZADO",
      description: `BOX ${newBoxData[index].number} ESTÁ AGORA ${newStatus === 'blocked' ? 'BLOQUEADO' : newStatus === 'free' ? 'LIVRE' : 'OCUPADO'}.`,
      duration: 2000,
    });
  };

  const handleDeleteBox = (index: number) => {
    const newBoxData = [...boxData];
    const boxNumber = newBoxData[index].number;
    newBoxData.splice(index, 1);
    setBoxData(newBoxData);
    
    toast({
      title: "BOX REMOVIDO",
      description: `BOX ${boxNumber} FOI REMOVIDO COM SUCESSO.`,
      duration: 2000,
    });
  };

  const handleAddBox = () => {
    const newBoxNumber = prompt("DIGITE O NÚMERO DO NOVO BOX:");
    if (!newBoxNumber) return;
    
    // Check if the box number already exists
    if (boxData.some(box => box.number.toLowerCase() === newBoxNumber.toLowerCase())) {
      toast({
        title: "ERRO AO ADICIONAR",
        description: "ESTE NÚMERO DE BOX JÁ EXISTE!",
        variant: "destructive",
      });
      return;
    }
    
    setBoxData([...boxData, { number: newBoxNumber.toUpperCase(), value: '', status: 'free' }]);
    
    toast({
      title: "BOX ADICIONADO",
      description: `BOX ${newBoxNumber.toUpperCase()} FOI ADICIONADO COM SUCESSO.`,
    });
  };
  
  const handleSaveBoxState = () => {
    try {
      localStorage.setItem('boxData', JSON.stringify(boxData));
      toast({
        title: "ESTADO SALVO",
        description: "ESTADO ATUAL DOS BOXES FOI SALVO COM SUCESSO.",
      });
    } catch (error) {
      toast({
        title: "ERRO AO SALVAR",
        description: "NÃO FOI POSSÍVEL SALVAR O ESTADO DOS BOXES.",
        variant: "destructive",
      });
    }
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
    toast({
      title: editMode ? "MODO EDIÇÃO DESATIVADO" : "MODO EDIÇÃO ATIVADO",
      description: editMode ? "SAINDO DO MODO DE EDIÇÃO DE PRÉ-BOX." : "AGORA VOCÊ PODE EDITAR OS PRÉ-BOXES.",
    });
  };

  const filteredBoxData = filterValue 
    ? boxData.filter(box => 
        box.number.toLowerCase().includes(filterValue.toLowerCase()) || 
        box.value.toLowerCase().includes(filterValue.toLowerCase()))
    : boxData;

  return (
    <Card className="border rounded-lg bg-white shadow-sm mb-8">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-semibold uppercase">CONTROLE DE PRÉ-BOX</CardTitle>
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
                <p>FILTRAR BOXES</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {/* Novo botão para alternar modo de edição */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={toggleEditMode}
                  className={`p-2 hover:bg-gray-100 rounded-full ${editMode ? 'bg-blue-100' : ''}`}
                >
                  <Edit size={18} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{editMode ? "DESATIVAR EDIÇÃO" : "ATIVAR EDIÇÃO"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {/* Botão para adicionar box - agora só aparece no modo de edição */}
          {editMode && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={handleAddBox}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <Plus size={18} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>ADICIONAR NOVO BOX</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {/* Botão para remover boxes - agora só aparece no modo de edição */}
          {editMode && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    className="p-2 hover:bg-gray-100 rounded-full text-red-500"
                  >
                    <Trash2 size={18} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>REMOVER BOXES (CLIQUE NOS BOXES PARA REMOVER)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={handleSaveBoxState}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <Save size={18} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>SALVAR ESTADO ATUAL</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>

      <CardContent>
        {showFilter && (
          <div className="mb-4 p-2 bg-gray-50 rounded-md">
            <input
              type="text"
              placeholder="FILTRAR POR NÚMERO OU VALOR DO BOX..."
              className="w-full p-2 border rounded-md uppercase"
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
            />
          </div>
        )}

        {showDuplicateWarning && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="uppercase">ATENÇÃO!</AlertTitle>
            <AlertDescription className="uppercase">
              EXISTE UMA VIAGEM VINCULADA A MAIS DE UM PRÉ-BOX. VERIFIQUE OS DADOS.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-3">
          {filteredBoxData.map((box, index) => (
            <Box
              key={`${box.number}-${index}`}
              number={box.number}
              value={box.value}
              status={box.status}
              onStatusChange={(newStatus) => handleStatusChange(index, newStatus)}
              onDelete={() => handleDeleteBox(index)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default BoxGrid;
