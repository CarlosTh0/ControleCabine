
import React from 'react';

type BoxStatus = 'blocked' | 'free' | 'occupied';

interface BoxProps {
  number: string;
  value: string;
  status: BoxStatus;
}

const Box = ({ number, value, status }: BoxProps) => {
  const getBackgroundColor = () => {
    switch (status) {
      case 'blocked':
        return 'bg-red-500';
      case 'free':
        return 'bg-green-50';
      default:
        return 'bg-white';
    }
  };

  return (
    <div className={`border border-gray-200 p-2 ${getBackgroundColor()}`}>
      <div className="text-xs text-gray-600 mb-1">{number}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
};

const BoxGrid = () => {
  const boxData = [
    { number: '50', value: '521268', status: 'occupied' },
    { number: '51', value: '521267', status: 'occupied' },
    { number: '52', value: '520803', status: 'occupied' },
    // First row sample data
  ];

  return (
    <div className="border rounded-lg bg-white p-4 shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Controle de Pré-Box</h2>
      <div className="grid grid-cols-16 gap-1">
        {boxData.map((box, index) => (
          <Box
            key={index}
            number={box.number}
            value={box.value}
            status={box.status}
          />
        ))}
      </div>
    </div>
  );
};

export default BoxGrid;
