
import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Plus, 
  Trash, 
  Filter
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type BoxStatus = 'blocked' | 'free' | 'occupied';

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
    if (status === 'free') return '*Livre*';
    return value;
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
      <div 
        className={`w-[120px] h-[100px] rounded-[20px] ${getBackgroundColor()} 
                   shadow-[rgba(50,50,93,0.25)_0px_30px_50px_-12px_inset,rgba(0,0,0,0.3)_0px_18px_26px_-18px_inset] 
                   transition-colors cursor-pointer p-4 flex flex-col justify-between`}
        onClick={handleClick}
      >
        <div className="text-sm font-semibold text-gray-600">{number}</div>
        <div className="text-base font-medium text-center">{displayValue()}</div>
      </div>
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

  const initialBoxData = generateBoxNumbers().map(number => {
    return { number, value: '', status: 'free' as BoxStatus };
  });

  const [boxData, setBoxData] = useState(initialBoxData);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filterValue, setFilterValue] = useState('');
  
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
        const boxIndex = newBoxData.findIndex(box => box.number === entry.preBox);
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
  };

  const handleDeleteBox = (index: number) => {
    const newBoxData = [...boxData];
    newBoxData.splice(index, 1);
    setBoxData(newBoxData);
  };

  const handleAddBox = () => {
    const newBoxNumber = prompt("Enter new box number:");
    if (!newBoxNumber) return;
    
    // Check if the box number already exists
    if (boxData.some(box => box.number === newBoxNumber)) {
      alert("This box number already exists!");
      return;
    }
    
    setBoxData([...boxData, { number: newBoxNumber, value: '', status: 'free' }]);
  };

  const filteredBoxData = filterValue 
    ? boxData.filter(box => 
        box.number.includes(filterValue) || 
        box.value.includes(filterValue))
    : boxData;

  return (
    <Card className="border rounded-lg bg-white shadow-sm mb-8">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-semibold">Controle de Pré-Box</CardTitle>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setShowFilter(!showFilter)}
            className="p-2 hover:bg-gray-100 rounded-full"
            title="Filter boxes"
          >
            <Filter size={18} />
          </button>
          <button 
            onClick={handleAddBox}
            className="p-2 hover:bg-gray-100 rounded-full"
            title="Add new box"
          >
            <Plus size={18} />
          </button>
        </div>
      </CardHeader>

      <CardContent>
        {showFilter && (
          <div className="mb-4 p-2 bg-gray-50 rounded-md">
            <input
              type="text"
              placeholder="Filter by box number or value..."
              className="w-full p-2 border rounded-md"
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
            />
          </div>
        )}

        {showDuplicateWarning && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Atenção!</AlertTitle>
            <AlertDescription>
              Existe uma viagem vinculada a mais de um PRÉ-BOX. Verifique os dados.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-8 xl:grid-cols-16 gap-3">
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
