
import React, { useState } from 'react';
import { Location, ActionType } from '../../types';
import { useAppData } from '../../contexts/AppDataContext';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { TrashIcon, PencilIcon, ChevronDownIcon, ChevronUpIcon } from '../common/Icons';

interface LocationCardProps {
  location: Location;
  onEdit: (location: Location) => void;
}

export const LocationCard: React.FC<LocationCardProps> = ({ location, onEdit }) => {
  const { dispatch } = useAppData();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleDelete = () => {
    // if (window.confirm(`「${location.name}」を本当に削除しますか？`)) {
    dispatch({ type: ActionType.DELETE_LOCATION, payload: location.id });
    // }
  };

  return (
    <Card className="mb-4">
      <div className="flex justify-between items-start">
        <h4 className="text-xl font-bold text-sky-400">{location.name}</h4>
        <div className="flex space-x-2 flex-shrink-0">
          <Button variant="secondary" onClick={() => onEdit(location)} className="p-2">
            <PencilIcon className="w-4 h-4" />
          </Button>
          <Button variant="danger" onClick={handleDelete} className="p-2">
            <TrashIcon className="w-4 h-4" />
          </Button>
           <Button variant="secondary" onClick={() => setIsExpanded(!isExpanded)} className="p-2">
            {isExpanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
          </Button>
        </div>
      </div>
      {isExpanded && (
         <div className="mt-4 pt-4 border-t border-slate-700">
            <p className="text-sm text-slate-300 whitespace-pre-wrap">{location.description}</p>
            {location.mapImageUrl && (
                <div className="mt-4">
                    <img src={location.mapImageUrl} alt={`Map of ${location.name}`} className="rounded-md max-w-full h-auto border border-slate-600" />
                </div>
            )}
        </div>
      )}
    </Card>
  );
};
