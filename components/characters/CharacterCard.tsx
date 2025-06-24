import React, { useState } from 'react';
import { Character, ActionType, Relationship } from '../../types';
import { useAppData } from '../../contexts/AppDataContext';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { TrashIcon, PencilIcon, ChevronDownIcon, ChevronUpIcon, LinkIcon } from '../common/Icons';
import { ConfirmModal } from '../common/ConfirmModal'; // Import ConfirmModal

interface CharacterCardProps {
  character: Character;
  onEdit: (character: Character) => void;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({ character, onEdit }) => {
  const { dispatch, state, getCharacterById } = useAppData();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const handleDeleteRequest = () => {
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = () => {
    dispatch({ type: ActionType.DELETE_CHARACTER, payload: character.id });
    setIsConfirmModalOpen(false);
  };

  const handleCancelDelete = () => {
    setIsConfirmModalOpen(false);
  };
  
  const characterRelationships = state.relationships.filter(
    rel => rel.char1Id === character.id || rel.char2Id === character.id
  );

  return (
    <>
      <Card className="mb-4">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="text-xl font-bold text-sky-400">{character.name}</h4>
            <p className="text-sm text-slate-400">年齢: {character.age || '未設定'} ・ 性別: {character.gender || '未設定'}</p>
          </div>
          <div className="flex space-x-2 flex-shrink-0">
            <Button variant="secondary" onClick={() => onEdit(character)} className="p-2" aria-label={`${character.name}を編集`}>
              <PencilIcon className="w-4 h-4" />
            </Button>
            <Button variant="danger" onClick={handleDeleteRequest} className="p-2" aria-label={`${character.name}を削除`}>
              <TrashIcon className="w-4 h-4" />
            </Button>
            <Button variant="secondary" onClick={() => setIsExpanded(!isExpanded)} className="p-2" aria-label={`${character.name}の詳細を${isExpanded ? '閉じる' : '開く'}`} aria-expanded={isExpanded}>
              {isExpanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-slate-700">
            <DetailItem label="外見" value={character.appearance} />
            <DetailItem label="性格" value={character.personality} />
            <DetailItem label="背景・経歴" value={character.backstory} />
            {character.notes && <DetailItem label="備考" value={character.notes} />}

            {characterRelationships.length > 0 && (
              <div className="mt-4">
                <h5 className="text-md font-semibold text-slate-300 mb-2 flex items-center">
                  <LinkIcon className="w-5 h-5 mr-2 text-sky-500" />
                  関連する関係性
                </h5>
                <ul className="space-y-2 pl-2">
                  {characterRelationships.map(rel => {
                    const otherCharId = rel.char1Id === character.id ? rel.char2Id : rel.char1Id;
                    const otherChar = getCharacterById(otherCharId);
                    const thisCharCallsOther = rel.char1Id === character.id ? rel.char1CallsChar2 : rel.char2CallsChar1;
                    const otherCharCallsThis = rel.char1Id === character.id ? rel.char2CallsChar1 : rel.char1CallsChar2;

                    return (
                      <li key={rel.id} className="text-sm p-2 bg-slate-700 rounded">
                        <strong className="text-sky-400">{otherChar?.name || '不明なキャラクター'}</strong> との関係:
                        <p className="ml-2 text-slate-400 whitespace-pre-wrap"> - {character.name} → {otherChar?.name || '相手'}: 「{thisCharCallsOther || '未設定'}」</p>
                        <p className="ml-2 text-slate-400 whitespace-pre-wrap"> - {otherChar?.name || '相手'} → {character.name}: 「{otherCharCallsThis || '未設定'}」</p>
                        <p className="ml-2 mt-1 text-slate-300 whitespace-pre-wrap">説明: {rel.description}</p>
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
        title="キャラクター削除の確認"
        message={<>本当に「<strong>{character.name}</strong>」を削除しますか？<br />このキャラクターに関連する全ての関係性も削除されます。</>}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        confirmText="削除"
        cancelText="キャンセル"
        confirmButtonVariant="danger"
      />
    </>
  );
};

const DetailItem: React.FC<{label: string, value?: string}> = ({label, value}) => (
  value ? <p className="text-sm text-slate-300 mb-1"><strong className="font-medium text-slate-100">{label}:</strong> <span className="whitespace-pre-wrap">{value}</span></p> : null
);
