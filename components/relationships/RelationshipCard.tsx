
import React, { useState } from 'react';
import { Relationship, ActionType } from '../../types';
import { useAppData } from '../../contexts/AppDataContext';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { TrashIcon, PencilIcon, UsersIcon, RouteFlowIcon, ChevronDownIcon, ChevronUpIcon } from '../common/Icons'; // Added Chevron icons
import { ConfirmModal } from '../common/ConfirmModal'; // Added ConfirmModal


interface RelationshipCardProps {
  relationship: Relationship;
  onEdit: (relationship: Relationship) => void;
}

export const RelationshipCard: React.FC<RelationshipCardProps> = ({ relationship, onEdit }) => {
  const { dispatch, getCharacterById, state } = useAppData();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);


  const char1 = getCharacterById(relationship.char1Id);
  const char2 = getCharacterById(relationship.char2Id);

  const handleDeleteRequest = () => {
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = () => {
    dispatch({ type: ActionType.DELETE_RELATIONSHIP, payload: relationship.id });
    setIsConfirmModalOpen(false);
  };
  
  const handleCancelDelete = () => {
    setIsConfirmModalOpen(false);
  };

  if (!char1 || !char2) {
    return <Card className="mb-4 border-red-500"><p className="text-red-400">関連キャラクターが見つからないため、この関係性を表示できません。(ID: {relationship.id})</p></Card>;
  }
  
  const relevantEventTitles = (relationship.relevantRouteEventIds || [])
    .map(eventId => state.routeEvents.find(event => event.id === eventId)?.title)
    .filter(Boolean);


  return (
    <>
      <Card className="mb-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-grow">
            <h4 className="text-lg font-bold text-sky-400 flex items-center">
                <UsersIcon className="w-5 h-5 mr-2 text-sky-500"/> 
                {char1.name} <span className="text-slate-400 mx-2">&harr;</span> {char2.name}
            </h4>
          </div>
          <div className="flex space-x-2 flex-shrink-0 ml-2">
            <Button variant="secondary" onClick={() => onEdit(relationship)} className="p-2">
              <PencilIcon className="w-4 h-4" />
            </Button>
            <Button variant="danger" onClick={handleDeleteRequest} className="p-2">
              <TrashIcon className="w-4 h-4" />
            </Button>
            <Button variant="secondary" onClick={() => setIsExpanded(!isExpanded)} className="p-2" aria-label="詳細表示切り替え">
              {isExpanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        
        <div className="space-y-1 text-sm">
          <p className="text-slate-300">
              <strong className="text-slate-100">{char1.name}</strong> → <strong className="text-slate-100">{char2.name}</strong>: 「<span className="text-sky-300">{relationship.char1CallsChar2 || '未設定'}</span>」
          </p>
          <p className="text-slate-300">
              <strong className="text-slate-100">{char2.name}</strong> → <strong className="text-slate-100">{char1.name}</strong>: 「<span className="text-sky-300">{relationship.char2CallsChar1 || '未設定'}</span>」
          </p>
          <p className="mt-2 pt-2 border-t border-slate-700 text-slate-300 whitespace-pre-wrap">
              <strong className="text-slate-100">関係性の説明:</strong> {relationship.description}
          </p>
        </div>

        {isExpanded && relevantEventTitles.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-700">
            <h5 className="text-xs font-semibold text-slate-400 mb-1 flex items-center">
              <RouteFlowIcon className="w-4 h-4 mr-1.5 text-sky-500" />
              関連ルートイベント:
            </h5>
            <ul className="list-disc list-inside pl-1 space-y-0.5">
              {relevantEventTitles.map((title, index) => (
                <li key={index} className="text-sm text-sky-300">{title}</li>
              ))}
            </ul>
          </div>
        )}
      </Card>
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        title="関係性削除の確認"
        message={<>キャラクター「<strong>{char1.name}</strong>」と「<strong>{char2.name}</strong>」の間のこの関係性を本当に削除しますか？</>}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        confirmText="削除"
        cancelText="キャンセル"
        confirmButtonVariant="danger"
      />
    </>
  );
};
