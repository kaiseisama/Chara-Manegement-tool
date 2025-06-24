
import React, { useState, useEffect } from 'react';
import { Relationship, ActionType, Character, RouteEvent } from '../../types';
import { useAppData } from '../../contexts/AppDataContext';
import { Select } from '../common/Select';
import { Input } from '../common/Input';
import { Textarea } from '../common/Textarea';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { ConfirmModal } from '../common/ConfirmModal'; 

interface RelationshipFormProps {
  relationshipToEdit?: Relationship | null;
  onClose: () => void;
}

const initialFormState: Omit<Relationship, 'id'> = {
  char1Id: '',
  char2Id: '',
  char1CallsChar2: '',
  char2CallsChar1: '',
  description: '',
  relevantRouteEventIds: [],
};

export const RelationshipForm: React.FC<RelationshipFormProps> = ({ relationshipToEdit, onClose }) => {
  const [formData, setFormData] = useState<Omit<Relationship, 'id'>>(initialFormState);
  const { state, dispatch, getCharacterById } = useAppData();
  const [char1Name, setChar1Name] = useState('');
  const [char2Name, setChar2Name] = useState('');
  const [isAlertOpen, setIsAlertOpen] = useState(false); 
  const [alertMessage, setAlertMessage] = useState<React.ReactNode>(''); 


  useEffect(() => {
    if (relationshipToEdit) {
      setFormData({
        char1Id: relationshipToEdit.char1Id,
        char2Id: relationshipToEdit.char2Id,
        char1CallsChar2: relationshipToEdit.char1CallsChar2,
        char2CallsChar1: relationshipToEdit.char2CallsChar1,
        description: relationshipToEdit.description,
        relevantRouteEventIds: relationshipToEdit.relevantRouteEventIds || [],
      });
      setChar1Name(getCharacterById(relationshipToEdit.char1Id)?.name || '');
      setChar2Name(getCharacterById(relationshipToEdit.char2Id)?.name || '');
    } else {
      setFormData(initialFormState);
      setChar1Name('');
      setChar2Name('');
    }
  }, [relationshipToEdit, getCharacterById]);

  const characterOptions = state.characters.map(char => ({ value: char.id, label: char.name }));

  const handleChar1Change = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const charId = e.target.value;
    setFormData(prev => ({ ...prev, char1Id: charId, char2Id: prev.char2Id === charId ? '' : prev.char2Id }));
    setChar1Name(getCharacterById(charId)?.name || '');
    if (formData.char2Id === charId) setChar2Name('');
  };

  const handleChar2Change = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const charId = e.target.value;
    setFormData(prev => ({ ...prev, char2Id: charId }));
    setChar2Name(getCharacterById(charId)?.name || '');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRouteEventSelection = (eventId: string) => {
    setFormData(prev => {
      const currentSelected = prev.relevantRouteEventIds || [];
      const newSelected = currentSelected.includes(eventId)
        ? currentSelected.filter(id => id !== eventId)
        : [...currentSelected, eventId];
      return { ...prev, relevantRouteEventIds: newSelected.sort() }; // Keep sorted for consistency if needed, though not strictly for this logic
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.char1Id || !formData.char2Id) {
      setAlertMessage("両方のキャラクターを選択してください。");
      setIsAlertOpen(true);
      return;
    }
    if (formData.char1Id === formData.char2Id) {
      setAlertMessage("同じキャラクター同士の関係は設定できません。");
      setIsAlertOpen(true);
      return;
    }

    const isEditing = !!relationshipToEdit;
    const currentRelId = relationshipToEdit?.id;

    // Find all existing relationships involving the same two characters,
    // EXCLUDING the current one if we are editing.
    const otherRelationshipsForPair = state.relationships.filter(rel => {
      if (isEditing && rel.id === currentRelId) {
        return false; 
      }
      return (
        (rel.char1Id === formData.char1Id && rel.char2Id === formData.char2Id) ||
        (rel.char1Id === formData.char2Id && rel.char2Id === formData.char1Id)
      );
    });

    const newRelevantIds = (formData.relevantRouteEventIds || []).filter(id => !!id); // Ensure array and filter falsy IDs

    if (newRelevantIds.length === 0) {
      // Trying to save a "general" relationship (no specific routes)
      const hasOtherGeneralRelationshipForPair = otherRelationshipsForPair.some(
        existingRel => (!existingRel.relevantRouteEventIds || existingRel.relevantRouteEventIds.length === 0)
      );
      if (hasOtherGeneralRelationshipForPair) {
        setAlertMessage(
          <>
            これらのキャラクター間の「一般的な」関係性（特定のルートイベントに関連付けられていないもの）は既に存在します。
            <br />
            既存の関係性を編集するか、この新しい関係性に特定のルートイベントを関連付けてください。
          </>
        );
        setIsAlertOpen(true);
        return;
      }
    } else {
      // Trying to save a "route-specific" relationship
      for (const newRouteId of newRelevantIds) {
        const isRouteIdUsedInOtherRelsForPair = otherRelationshipsForPair.some(
          existingRel => (existingRel.relevantRouteEventIds || []).includes(newRouteId)
        );
        if (isRouteIdUsedInOtherRelsForPair) {
          const conflictingEvent = state.routeEvents.find(event => event.id === newRouteId);
          setAlertMessage(
            <>
              選択されたルートイベント「<strong>{conflictingEvent?.title || newRouteId}</strong>」は、これらのキャラクター間の別の既存の関係性で既に使用されています。
              <br />
              ルートイベントの選択を変更するか、既存の関係性を編集してください。
            </>
          );
          setIsAlertOpen(true);
          return;
        }
      }
    }
    
    if (relationshipToEdit) {
      dispatch({ type: ActionType.UPDATE_RELATIONSHIP, payload: { ...relationshipToEdit, ...formData, relevantRouteEventIds: newRelevantIds } });
    } else {
      const newRelationship: Relationship = {
        id: Date.now().toString() + Math.random().toString(36).substring(2,9),
        ...formData,
        relevantRouteEventIds: newRelevantIds,
      };
      dispatch({ type: ActionType.ADD_RELATIONSHIP, payload: newRelationship });
    }
    onClose();
  };
  
  const char1Placeholder = char1Name || "相手";
  const char2Placeholder = char2Name || "相手";


  return (
    <>
      <Card className="mb-6">
        <h3 className="text-xl font-semibold text-sky-400 mb-4">
          {relationshipToEdit ? '関係性編集' : '新規関係性作成'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select 
              id="char1Id" 
              name="char1Id" 
              label="キャラクター1" 
              options={characterOptions} 
              value={formData.char1Id} 
              onChange={handleChar1Change} 
              required 
            />
            <Select 
              id="char2Id" 
              name="char2Id" 
              label="キャラクター2" 
              options={characterOptions.filter(opt => opt.value !== formData.char1Id)}
              value={formData.char2Id} 
              onChange={handleChar2Change} 
              required 
              disabled={!formData.char1Id}
            />
          </div>
          
          {formData.char1Id && formData.char2Id && (
              <>
                  <Input 
                      id="char1CallsChar2" 
                      name="char1CallsChar2" 
                      label={`${char1Name || 'キャラクター1'} は ${char2Name || 'キャラクター2'} をどう呼ぶ？`}
                      value={formData.char1CallsChar2} 
                      onChange={handleChange} 
                      placeholder={`例: 「${char2Placeholder}の旦那」`}
                  />
                  <Input 
                      id="char2CallsChar1" 
                      name="char2CallsChar1" 
                      label={`${char2Name || 'キャラクター2'} は ${char1Name || 'キャラクター1'} をどう呼ぶ？`}
                      value={formData.char2CallsChar1} 
                      onChange={handleChange} 
                      placeholder={`例: 「${char1Placeholder}ちゃん」`}
                  />
              </>
          )}
          <Textarea 
              id="description" 
              name="description" 
              label="関係性の説明" 
              value={formData.description} 
              onChange={handleChange}
              placeholder="例: 長年のライバルだが、互いに認め合っている。"
              required
          />

          {/* Relevant Route Events Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">関連ルートイベント (複数選択可)</label>
            {state.routeEvents.length > 0 ? (
              <div className="max-h-48 overflow-y-auto bg-slate-700 p-2 rounded-md border border-slate-600 space-y-1">
                {state.routeEvents.map((event: RouteEvent) => (
                  <label key={event.id} className="flex items-center space-x-2 p-1 hover:bg-slate-600 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-sky-500 bg-slate-800 border-slate-600 rounded focus:ring-sky-500"
                      checked={(formData.relevantRouteEventIds || []).includes(event.id)}
                      onChange={() => handleRouteEventSelection(event.id)}
                    />
                    <span className="text-slate-200">{event.title}</span>
                  </label>
                ))}
              </div>
            ) : <p className="text-sm text-slate-400">登録済みのルートイベントがありません。</p>}
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" variant="secondary" onClick={onClose}>
              キャンセル
            </Button>
            <Button type="submit" variant="primary">
              {relationshipToEdit ? '更新' : '作成'}
            </Button>
          </div>
        </form>
      </Card>

      <ConfirmModal
        isOpen={isAlertOpen}
        title="重複警告"
        message={alertMessage}
        onConfirm={() => setIsAlertOpen(false)}
        confirmButtonVariant="primary" 
      />
    </>
  );
};
