
import React, { useState } from 'react';
import { LoreEntry, ActionType } from '../../types';
import { useAppData } from '../../contexts/AppDataContext';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { TrashIcon, PencilIcon, ChevronDownIcon, ChevronUpIcon } from '../common/Icons';

interface LoreCardProps {
  loreEntry: LoreEntry;
  onEdit: (loreEntry: LoreEntry) => void;
}

export const LoreCard: React.FC<LoreCardProps> = ({ loreEntry, onEdit }) => {
  const { dispatch } = useAppData();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleDelete = () => {
    // if (window.confirm(`「${loreEntry.title}」を本当に削除しますか？`)) {
    dispatch({ type: ActionType.DELETE_LORE_ENTRY, payload: loreEntry.id });
    // }
  };

  return (
    <Card className="mb-4">
      <div className="flex justify-between items-start">
        <div>
            <h4 className="text-xl font-bold text-sky-400">{loreEntry.title}</h4>
            <p className="text-sm text-slate-400">カテゴリー: {loreEntry.category}</p>
        </div>
        <div className="flex space-x-2 flex-shrink-0">
          <Button variant="secondary" onClick={() => onEdit(loreEntry)} className="p-2">
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
            <p className="text-sm text-slate-300 whitespace-pre-wrap">{loreEntry.content}</p>
        </div>
      )}
    </Card>
  );
};
