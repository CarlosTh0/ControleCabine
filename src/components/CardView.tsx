import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

interface CardViewProps {
  entries: ControlEntry[];
  onDelete: (index: number) => void;
  onEdit: (index: number, field: keyof ControlEntry, value: any) => void;
}

const CardView = ({ entries, onDelete, onEdit }: CardViewProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {entries.map((entry, index) => (
        <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="pb-2 flex flex-row justify-between items-start">
            <CardTitle className="text-lg font-bold">
              Viagem {entry.trip}
            </CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onDelete(index)}
                    className="p-1 text-red-500 hover:text-red-700 rounded-full hover:bg-red-50 transition-colors duration-200"
                  >
                    <Trash size={16} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>EXCLUIR REGISTRO</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="space-y-2">
                <div>
                  <span className="font-semibold text-gray-500">Data:</span>
                  <p>{entry.date}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-500">Hora:</span>
                  <p>{entry.time}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-500">Viagem Anterior:</span>
                  <p>{entry.oldTrip || '-'}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-500">Pré-Box:</span>
                  <p>{entry.preBox || '-'}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="font-semibold text-gray-500">Box-D:</span>
                  <p>{entry.boxInside || '-'}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-500">Quantidade:</span>
                  <p>{entry.quantity || '0'}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-500">Turno:</span>
                  <p>{entry.shift || '-'}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-500">Tipo de Carga:</span>
                  <p>{entry.cargoType || '-'}</p>
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div>
                <span className="font-semibold text-gray-500">Região:</span>
                <p>{entry.region || '-'}</p>
              </div>
              <div>
                <span className="font-semibold text-gray-500">Status:</span>
                <p className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                  entry.status ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {entry.status || 'PENDENTE'}
                </p>
              </div>
              <div>
                <span className="font-semibold text-gray-500">Data Seguinte:</span>
                <p>{entry.manifestDate || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default CardView; 