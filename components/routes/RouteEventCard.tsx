
import React, { useState } from 'react';
import { RouteEvent, ActionType, Relationship } from '../../types';
import { useAppData } from '../../contexts/AppDataContext';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { TrashIcon, PencilIcon, ChevronDownIcon, ChevronUpIcon, UsersIcon, MapIcon, ClockIcon, RouteFlowIcon, LinkIcon } from '../common/Icons';
import { ConfirmModal } from '../common/ConfirmModal';

interface RouteEventCardProps {
  routeEvent: RouteEvent;
  onEdit: (event: RouteEvent) => void;
}

export const RouteEventCard: React.FC<RouteEventCardProps> = ({ routeEvent, onEdit }) => {
  const { dispatch, state, getCharacterById } = useAppData();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const getLocationById = (id: string) => state.locations.find(loc => loc.id === id);
  const getRouteEventTitleById = (id: string) => state.routeEvents.find(event => event.id === id)?.title;

  const handleDeleteRequest = () => {
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = () => {
    dispatch({ type: ActionType.DELETE_ROUTE_EVENT, payload: routeEvent.id });
    setIsConfirmModalOpen(false);
  };

  const handleCancelDelete = () => {
    setIsConfirmModalOpen(false);
  };

  const involvedCharacters = routeEvent.characterIds.map(id => getCharacterById(id)?.name).filter(Boolean);
  const involvedLocations = routeEvent.locationIds.map(id => getLocationById(id)?.name).filter(Boolean);
  const parentEventTitles = routeEvent.parentEventIds.map(id => getRouteEventTitleById(id)).filter(Boolean);
  const childEventTitles = routeEvent.childEventIds.map(id => getRouteEventTitleById(id)).filter(Boolean);

  const relevantRelationships = state.relationships.filter(
    rel => (rel.relevantRouteEventIds || []).includes(routeEvent.id)
  );


  return (
    <>
      <Card className="mb-4">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="text-xl font-bold text-sky-400">{routeEvent.title}</h4>
            {routeEvent.dateTime && (
              <p className="text-sm text-slate-400 flex items-center">
                <ClockIcon className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                {routeEvent.dateTime}
              </p>
            )}
            {routeEvent.isBranchPoint && (
                <span className="mt-1 inline-block bg-sky-700 text-sky-200 text-xs font-semibold px-2 py-0.5 rounded">分岐点</span>
            )}
          </div>
          <div className="flex space-x-2 flex-shrink-0">
            <Button variant="secondary" onClick={() => onEdit(routeEvent)} className="p-2" aria-label={`${routeEvent.title}を編集`}>
              <PencilIcon className="w-4 h-4" />
            </Button>
            <Button variant="danger" onClick={handleDeleteRequest} className="p-2" aria-label={`${routeEvent.title}を削除`}>
              <TrashIcon className="w-4 h-4" />
            </Button>
            <Button variant="secondary" onClick={() => setIsExpanded(!isExpanded)} className="p-2" aria-label={`${routeEvent.title}の詳細を${isExpanded ? '閉じる' : '開く'}`} aria-expanded={isExpanded}>
              {isExpanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-slate-700 space-y-3">
            <p className="text-sm text-slate-300 whitespace-pre-wrap"><strong className="font-medium text-slate-100">説明:</strong> {routeEvent.description}</p>
            
            {routeEvent.isBranchPoint && routeEvent.branchCondition && (
                 <p className="text-sm text-slate-300"><strong className="font-medium text-slate-100">分岐条件:</strong> <span className="whitespace-pre-wrap">{routeEvent.branchCondition}</span></p>
            )}

            {involvedCharacters.length > 0 && (
              <div>
                <h5 className="text-xs font-semibold text-slate-400 mb-1 flex items-center"><UsersIcon className="w-4 h-4 mr-1.5"/>関与キャラクター:</h5>
                <p className="text-sm text-sky-300">{involvedCharacters.join(', ')}</p>
              </div>
            )}

            {involvedLocations.length > 0 && (
              <div>
                <h5 className="text-xs font-semibold text-slate-400 mb-1 flex items-center"><MapIcon className="w-4 h-4 mr-1.5"/>関連場所:</h5>
                <p className="text-sm text-sky-300">{involvedLocations.join(', ')}</p>
              </div>
            )}

            {parentEventTitles.length > 0 && (
              <div>
                <h5 className="text-xs font-semibold text-slate-400 mb-1 flex items-center"><RouteFlowIcon className="w-4 h-4 mr-1.5 transform rotate-180"/>先行イベント:</h5>
                <p className="text-sm text-sky-300">{parentEventTitles.join(', ')}</p>
              </div>
            )}

            {childEventTitles.length > 0 && (
              <div>
                <h5 className="text-xs font-semibold text-slate-400 mb-1 flex items-center"><RouteFlowIcon className="w-4 h-4 mr-1.5"/>後続イベント:</h5>
                <p className="text-sm text-sky-300">{childEventTitles.join(', ')}</p>
              </div>
            )}

            {relevantRelationships.length > 0 && (
              <div>
                <h5 className="text-xs font-semibold text-slate-400 mb-1 flex items-center">
                  <LinkIcon className="w-4 h-4 mr-1.5 text-sky-500" />
                  このイベントに特に関連する関係性:
                </h5>
                <ul className="list-disc list-inside pl-1 space-y-1">
                  {relevantRelationships.map((rel: Relationship) => {
                    const char1 = getCharacterById(rel.char1Id);
                    const char2 = getCharacterById(rel.char2Id);
                    return (
                      <li key={rel.id} className="text-sm text-sky-300">
                        {char1?.name || '?'} &harr; {char2?.name || '?'} 
                        <span className="text-slate-400 text-xs ml-1">({rel.char1CallsChar2} / {rel.char2CallsChar1})</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        )}
      </Card>
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        title="ルートイベント削除の確認"
        message={<>本当に「<strong>{routeEvent.title}</strong>」を削除しますか？<br/>このイベントを参照している他のイベントの関連リンクも解除されます。<br/>また、このイベントに関連付けられている関係性からもこのイベントへの参照が解除されます。</>}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        confirmText="削除"
        cancelText="キャンセル"
        confirmButtonVariant="danger"
      />
    </>
  );
};
