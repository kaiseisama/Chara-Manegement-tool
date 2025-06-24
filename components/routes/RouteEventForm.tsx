import React, { useState, useEffect } from 'react';
import { RouteEvent, ActionType, Character, Location as WorldLocation } from '../../types';
import { useAppData } from '../../contexts/AppDataContext';
import { Input } from '../common/Input';
import { Textarea } from '../common/Textarea';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { ConfirmModal } from '../common/ConfirmModal';

interface RouteEventFormProps {
  eventToEdit?: RouteEvent | null;
  onClose: () => void;
}

const initialFormState: Omit<RouteEvent, 'id'> = {
  title: '',
  description: '',
  dateTime: '',
  characterIds: [],
  locationIds: [],
  parentEventIds: [],
  childEventIds: [],
  isBranchPoint: false,
  branchCondition: '',
};

// Helper function to check if potentialAncestorId is an ancestor of targetId
const isAncestor = (
  targetId: string,
  potentialAncestorId: string,
  allEvents: RouteEvent[],
  visited: Set<string> = new Set()
): boolean => {
  if (targetId === potentialAncestorId) return true; // Found itself, which means it's an ancestor in this context
  if (visited.has(targetId)) return false; // Already visited this node in current path, cycle detected earlier or not an ancestor via this path
  visited.add(targetId);

  const targetEvent = allEvents.find(e => e.id === targetId);
  if (!targetEvent || !targetEvent.parentEventIds || targetEvent.parentEventIds.length === 0) {
    visited.delete(targetId); // Backtrack
    return false; // No parents, so potentialAncestorId cannot be an ancestor
  }

  for (const parentId of targetEvent.parentEventIds) {
    if (isAncestor(parentId, potentialAncestorId, allEvents, visited)) {
      visited.delete(targetId); // Backtrack
      return true;
    }
  }
  visited.delete(targetId); // Backtrack
  return false;
};

// Helper function to check if potentialDescendantId is a descendant of targetId
const isDescendant = (
  targetId: string,
  potentialDescendantId: string,
  allEvents: RouteEvent[],
  visited: Set<string> = new Set()
): boolean => {
  if (targetId === potentialDescendantId) return true;
  if (visited.has(targetId)) return false;
  visited.add(targetId);

  const targetEvent = allEvents.find(e => e.id === targetId);
  if (!targetEvent || !targetEvent.childEventIds || targetEvent.childEventIds.length === 0) {
    visited.delete(targetId);
    return false;
  }

  for (const childId of targetEvent.childEventIds) {
    if (isDescendant(childId, potentialDescendantId, allEvents, visited)) {
      visited.delete(targetId);
      return true;
    }
  }
  visited.delete(targetId);
  return false;
};


export const RouteEventForm: React.FC<RouteEventFormProps> = ({ eventToEdit, onClose }) => {
  const [formData, setFormData] = useState<Omit<RouteEvent, 'id'>>(initialFormState);
  const { state, dispatch } = useAppData();
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState<React.ReactNode>('');

  useEffect(() => {
    if (eventToEdit) {
      setFormData({
        title: eventToEdit.title,
        description: eventToEdit.description,
        dateTime: eventToEdit.dateTime || '',
        characterIds: eventToEdit.characterIds || [],
        locationIds: eventToEdit.locationIds || [],
        parentEventIds: eventToEdit.parentEventIds || [],
        childEventIds: eventToEdit.childEventIds || [],
        isBranchPoint: eventToEdit.isBranchPoint || false,
        branchCondition: eventToEdit.branchCondition || '',
      });
    } else {
      setFormData(initialFormState);
    }
  }, [eventToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleMultiSelectChange = (
    entityType: 'characterIds' | 'locationIds' | 'parentEventIds' | 'childEventIds',
    changedId: string
  ) => {
    const currentEditingEventId = eventToEdit?.id;
    const currentIdsInForm = formData[entityType] || [];
    const isCurrentlySelectedInForm = currentIdsInForm.includes(changedId);

    // --- CYCLIC DEPENDENCY CHECKS ---
    if (currentEditingEventId) { // Only for existing events during editing links
      if (entityType === 'parentEventIds' && !isCurrentlySelectedInForm) {
        // Trying to add `changedId` as a parent to `currentEditingEventId`
        // Check if `changedId` is already a descendant of `currentEditingEventId`
        if (isDescendant(currentEditingEventId, changedId, state.routeEvents, new Set())) {
          const currentEventDetails = state.routeEvents.find(e => e.id === currentEditingEventId);
          const parentCandidateDetails = state.routeEvents.find(e => e.id === changedId);
          setAlertMessage(
            <>
              時系列の矛盾: 「<strong>{parentCandidateDetails?.title || changedId}</strong>」を「<strong>{currentEventDetails?.title || currentEditingEventId}</strong>」の先行イベントとして設定できません。
              <br />
              これにより循環参照が発生します（選択されたイベントは既にこのイベントの後続に位置しています）。
            </>
          );
          setIsAlertOpen(true);
          return; // Block the selection
        }
      }
      if (entityType === 'childEventIds' && !isCurrentlySelectedInForm) {
        // Trying to add `changedId` as a child to `currentEditingEventId`
        // Check if `changedId` is already an ancestor of `currentEditingEventId`
         if (isAncestor(currentEditingEventId, changedId, state.routeEvents, new Set())) {
          const currentEventDetails = state.routeEvents.find(e => e.id === currentEditingEventId);
          const childCandidateDetails = state.routeEvents.find(e => e.id === changedId);
          setAlertMessage(
            <>
              時系列の矛盾: 「<strong>{childCandidateDetails?.title || changedId}</strong>」を「<strong>{currentEventDetails?.title || currentEditingEventId}</strong>」の後続イベントとして設定できません。
              <br />
              これにより循環参照が発生します（選択されたイベントは既にこのイベントの先行に位置しています）。
            </>
          );
          setIsAlertOpen(true);
          return; // Block the selection
        }
      }
    }
    // --- END CYCLIC DEPENDENCY CHECKS ---


    // --- BRANCH POINT CHECKS (Non-cyclic) ---
    if (eventToEdit && entityType === 'parentEventIds' && !isCurrentlySelectedInForm) {
      const parentCandidate = state.routeEvents.find(event => event.id === changedId);
      if (parentCandidate) {
        const currentChildrenOfParent = parentCandidate.childEventIds || [];
        if (!currentChildrenOfParent.includes(eventToEdit.id) && 
            (currentChildrenOfParent.length + 1 > 1) && 
            !parentCandidate.isBranchPoint) {
          setAlertMessage(
            <>
              選択された先行イベント「<strong>{parentCandidate.title}</strong>」は分岐点としてマークされていません。
              <br />
              このイベントを子として追加すると当該先行イベントが複数の後続イベントを持つことになるため、許可されません。
            </>
          );
          setIsAlertOpen(true);
          return;
        }
      }
    }
     // When adding a new child to current event, check if current event can support another child
    if (entityType === 'childEventIds' && !isCurrentlySelectedInForm) { // Adding a new child
        if ((formData.childEventIds.length + 1 > 1) && !formData.isBranchPoint && currentEditingEventId) {
            // Check if current event (being edited) is not a branch point but is about to have >1 children
            const currentEventDetails = state.routeEvents.find(e => e.id === currentEditingEventId);
             setAlertMessage(
                <>
                  イベント「<strong>{currentEventDetails?.title || "このイベント"}</strong>」は分岐点としてマークされていません。
                  <br />
                  これ以上後続イベントを追加することはできません。先にこのイベントを分岐点としてマークしてください。
                </>
            );
            setIsAlertOpen(true);
            return;
        }
    }
    // --- END BRANCH POINT CHECKS ---


    // Update local formData
    setFormData(prev => {
      const currentIds = prev[entityType] || [];
      const newIds = isCurrentlySelectedInForm
        ? currentIds.filter(existingId => existingId !== changedId)
        : [...currentIds, changedId];
      return { ...prev, [entityType]: newIds.sort() };
    });

    // If editing an existing event, and it's a parent/child link, update the other event
    if (currentEditingEventId && (entityType === 'parentEventIds' || entityType === 'childEventIds')) {
      const otherEvent = state.routeEvents.find(event => event.id === changedId);
      if (!otherEvent) return;

      let actionPayload: RouteEvent | null = null;

      if (entityType === 'parentEventIds') { // Current form event is CHILD, otherEvent is PARENT
        let updatedOtherEventChildIds = [...(otherEvent.childEventIds || [])];
        if (isCurrentlySelectedInForm) {
          updatedOtherEventChildIds = updatedOtherEventChildIds.filter(id => id !== currentEditingEventId);
        } else {
          if (!updatedOtherEventChildIds.includes(currentEditingEventId)) {
            updatedOtherEventChildIds.push(currentEditingEventId);
          }
        }
        actionPayload = { ...otherEvent, childEventIds: Array.from(new Set(updatedOtherEventChildIds)).sort() };
      } else { // entityType === 'childEventIds' // Current form event is PARENT, otherEvent is CHILD
        let updatedOtherEventParentIds = [...(otherEvent.parentEventIds || [])];
        if (isCurrentlySelectedInForm) {
          updatedOtherEventParentIds = updatedOtherEventParentIds.filter(id => id !== currentEditingEventId);
        } else {
          if (!updatedOtherEventParentIds.includes(currentEditingEventId)) {
            updatedOtherEventParentIds.push(currentEditingEventId);
          }
        }
        actionPayload = { ...otherEvent, parentEventIds: Array.from(new Set(updatedOtherEventParentIds)).sort() };
      }
      
      if(actionPayload){
        // Safeguard for the OTHER event regarding branching (less likely to be the primary error source here now)
        if (actionPayload.childEventIds && actionPayload.childEventIds.length > 1 && !actionPayload.isBranchPoint) {
            // This case should be rare now due to checks when *adding* a parent to formData.
            // However, if removing a link elsewhere made this an issue.
             setAlertMessage(
                <>
                  関連イベント「<strong>{actionPayload.title}</strong>」の更新により、分岐点でないイベントが複数の後続を持つ状態になります。
                  <br />
                  操作を調整してください。
                </>
            );
            setIsAlertOpen(true);
            // Revert local formData change? For now, we allow dispatch and rely on submit for overall consistency.
        }
         dispatch({ type: ActionType.UPDATE_ROUTE_EVENT, payload: actionPayload });
      }
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      setAlertMessage("タイトルと説明は必須です。");
      setIsAlertOpen(true);
      return;
    }

    const finalFormData = {
        ...formData,
        characterIds: Array.from(new Set(formData.characterIds)).sort(),
        locationIds: Array.from(new Set(formData.locationIds)).sort(),
        parentEventIds: Array.from(new Set(formData.parentEventIds)).sort(),
        childEventIds: Array.from(new Set(formData.childEventIds)).sort(),
    };
    
    const eventIdForCheck = eventToEdit?.id || "prospective_new_event"; // Use a placeholder for new events for checks

    // --- CYCLIC DEPENDENCY CHECKS for SUBMIT ---
    for (const parentId of finalFormData.parentEventIds) {
      if (isDescendant(eventIdForCheck, parentId, state.routeEvents, new Set())) {
        const parentDetails = state.routeEvents.find(e => e.id === parentId);
        setAlertMessage(
          <>
            時系列の矛盾: 先行イベント「<strong>{parentDetails?.title || parentId}</strong>」は、
            現在保存しようとしているイベント「<strong>{finalFormData.title}</strong>」の後続に既に位置しており、循環参照が発生します。
          </>
        );
        setIsAlertOpen(true);
        return;
      }
    }
    for (const childId of finalFormData.childEventIds) {
      if (isAncestor(eventIdForCheck, childId, state.routeEvents, new Set())) {
         const childDetails = state.routeEvents.find(e => e.id === childId);
        setAlertMessage(
          <>
            時系列の矛盾: 後続イベント「<strong>{childDetails?.title || childId}</strong>」は、
            現在保存しようとしているイベント「<strong>{finalFormData.title}</strong>」の先行に既に位置しており、循環参照が発生します。
          </>
        );
        setIsAlertOpen(true);
        return;
      }
    }
     // If it's a new event, we also need to simulate its addition to check cycles with its own prospective ID.
    if (!eventToEdit) {
        const tempEventForCycleCheck: RouteEvent = { id: eventIdForCheck, ...finalFormData };
        const eventsWithTemp = [...state.routeEvents, tempEventForCycleCheck];
        for (const parentId of finalFormData.parentEventIds) {
            if (isDescendant(eventIdForCheck, parentId, eventsWithTemp, new Set())) {
                 const parentDetails = state.routeEvents.find(e => e.id === parentId);
                setAlertMessage(
                <>
                    時系列の矛盾 (新規イベント): 先行イベント「<strong>{parentDetails?.title || parentId}</strong>」と
                    「<strong>{finalFormData.title}</strong>」の間で循環参照が形成されます。
                </>
                );
                setIsAlertOpen(true);
                return;
            }
        }
        for (const childId of finalFormData.childEventIds) {
            if (isAncestor(eventIdForCheck, childId, eventsWithTemp, new Set())) {
                const childDetails = state.routeEvents.find(e => e.id === childId);
                setAlertMessage(
                <>
                    時系列の矛盾 (新規イベント): 後続イベント「<strong>{childDetails?.title || childId}</strong>」と
                    「<strong>{finalFormData.title}</strong>」の間で循環参照が形成されます。
                </>
                );
                setIsAlertOpen(true);
                return;
            }
        }
    }
    // --- END CYCLIC DEPENDENCY CHECKS for SUBMIT ---

    // --- BRANCH POINT CHECKS for SUBMIT ---
    if (finalFormData.childEventIds.length > 1 && !finalFormData.isBranchPoint) {
      setAlertMessage(
        <>
          イベント「<strong>{finalFormData.title}</strong>」には複数の後続イベントが設定されていますが、「分岐点」としてマークされていません。
        </>
      );
      setIsAlertOpen(true);
      return;
    }
    if (!eventToEdit) { 
      for (const parentId of finalFormData.parentEventIds) {
        const parentEvent = state.routeEvents.find(e => e.id === parentId);
        if (parentEvent) {
          const potentialChildIdsForParent = Array.from(new Set([...(parentEvent.childEventIds || []), "temp_new_event_id"]));
          if (potentialChildIdsForParent.length > 1 && !parentEvent.isBranchPoint) {
            setAlertMessage(
              <>
                選択された先行イベント「<strong>{parentEvent.title}</strong>」は分岐点としてマークされていません。
                この新しいイベントを子として追加すると、当該先行イベントが複数の後続を持つことになります。
              </>
            );
            setIsAlertOpen(true);
            return;
          }
        }
      }
    }
    // --- END BRANCH POINT CHECKS for SUBMIT ---

    if (eventToEdit) {
      dispatch({ type: ActionType.UPDATE_ROUTE_EVENT, payload: { ...eventToEdit, ...finalFormData } });
    } else {
      const newEventId = Date.now().toString() + Math.random().toString(36).substring(2, 9);
      const newEvent: RouteEvent = {
        id: newEventId,
        ...finalFormData,
      };
      dispatch({ type: ActionType.ADD_ROUTE_EVENT, payload: newEvent });

      // Update parent events to include this new event as a child
      finalFormData.parentEventIds.forEach(parentId => {
        const parentEvent = state.routeEvents.find(e => e.id === parentId);
        if (parentEvent) {
          const updatedChildIds = Array.from(new Set([...(parentEvent.childEventIds || []), newEventId])).sort();
          dispatch({ type: ActionType.UPDATE_ROUTE_EVENT, payload: { ...parentEvent, childEventIds: updatedChildIds } });
        }
      });

      // Update child events to include this new event as a parent
      finalFormData.childEventIds.forEach(childId => {
        const childEvent = state.routeEvents.find(e => e.id === childId);
        if (childEvent) {
          const updatedParentIds = Array.from(new Set([...(childEvent.parentEventIds || []), newEventId])).sort();
          dispatch({ type: ActionType.UPDATE_ROUTE_EVENT, payload: { ...childEvent, parentEventIds: updatedParentIds } });
        }
      });
    }
    onClose();
  };
  
  const availableParentEvents = state.routeEvents.filter(event => event.id !== eventToEdit?.id);
  const availableChildEvents = state.routeEvents.filter(event => event.id !== eventToEdit?.id);

  return (
    <>
      <Card className="mb-6">
        <h3 className="text-xl font-semibold text-sky-400 mb-4">
          {eventToEdit ? 'ルートイベント編集' : '新規ルートイベント作成'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input id="title" name="title" label="タイトル" value={formData.title} onChange={handleChange} required />
          <Textarea id="description" name="description" label="説明" value={formData.description} onChange={handleChange} rows={3} required />
          <Input id="dateTime" name="dateTime" label="発生日時 (任意)" value={formData.dateTime || ''} onChange={handleChange} placeholder="例: 3日目の朝, 帝国暦1024年 夏至" />

          {/* Character Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">関与キャラクター (複数選択可)</label>
            {state.characters.length > 0 ? (
              <div className="max-h-40 overflow-y-auto bg-slate-700 p-2 rounded-md border border-slate-600 space-y-1">
                {state.characters.map((char: Character) => (
                  <label key={char.id} className="flex items-center space-x-2 p-1 hover:bg-slate-600 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-sky-500 bg-slate-800 border-slate-600 rounded focus:ring-sky-500"
                      checked={(formData.characterIds || []).includes(char.id)}
                      onChange={() => handleMultiSelectChange('characterIds', char.id)}
                    />
                    <span className="text-slate-200">{char.name}</span>
                  </label>
                ))}
              </div>
            ) : <p className="text-sm text-slate-400">登録済みのキャラクターがいません。</p>}
          </div>

          {/* Location Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">関連場所 (複数選択可)</label>
            {state.locations.length > 0 ? (
            <div className="max-h-40 overflow-y-auto bg-slate-700 p-2 rounded-md border border-slate-600 space-y-1">
              {state.locations.map((loc: WorldLocation) => (
                <label key={loc.id} className="flex items-center space-x-2 p-1 hover:bg-slate-600 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-sky-500 bg-slate-800 border-slate-600 rounded focus:ring-sky-500"
                    checked={(formData.locationIds || []).includes(loc.id)}
                    onChange={() => handleMultiSelectChange('locationIds', loc.id)}
                  />
                  <span className="text-slate-200">{loc.name}</span>
                </label>
              ))}
            </div>
             ) : <p className="text-sm text-slate-400">登録済みの場所がいません。</p>}
          </div>
          
          {/* Parent Event Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">先行イベント (複数選択可)</label>
            {availableParentEvents.length > 0 ? (
            <div className="max-h-40 overflow-y-auto bg-slate-700 p-2 rounded-md border border-slate-600 space-y-1">
              {availableParentEvents.map((event: RouteEvent) => (
                <label key={event.id} className="flex items-center space-x-2 p-1 hover:bg-slate-600 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-sky-500 bg-slate-800 border-slate-600 rounded focus:ring-sky-500"
                    checked={(formData.parentEventIds || []).includes(event.id)}
                    onChange={() => handleMultiSelectChange('parentEventIds', event.id)}
                  />
                  <span className="text-slate-200">{event.title}</span>
                </label>
              ))}
            </div>
            ) : <p className="text-sm text-slate-400">他に選択可能な先行イベントがありません。</p>}
          </div>

          {/* Child Event Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">後続イベント (複数選択可)</label>
             {availableChildEvents.length > 0 ? (
            <div className="max-h-40 overflow-y-auto bg-slate-700 p-2 rounded-md border border-slate-600 space-y-1">
              {availableChildEvents.map((event: RouteEvent) => (
                <label key={event.id} className="flex items-center space-x-2 p-1 hover:bg-slate-600 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-sky-500 bg-slate-800 border-slate-600 rounded focus:ring-sky-500"
                    checked={(formData.childEventIds || []).includes(event.id)}
                    onChange={() => handleMultiSelectChange('childEventIds', event.id)}
                  />
                  <span className="text-slate-200">{event.title}</span>
                </label>
              ))}
            </div>
            ) : <p className="text-sm text-slate-400">他に選択可能な後続イベントがありません。</p>}
          </div>

          {/* Branch Point Information */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                name="isBranchPoint"
                className="form-checkbox h-4 w-4 text-sky-500 bg-slate-800 border-slate-600 rounded focus:ring-sky-500"
                checked={formData.isBranchPoint || false}
                onChange={handleChange}
              />
              <span className="text-sm font-medium text-slate-300">これは分岐点ですか？</span>
            </label>
            {formData.isBranchPoint && (
              <Textarea
                id="branchCondition"
                name="branchCondition"
                label="分岐条件"
                value={formData.branchCondition || ''}
                onChange={handleChange}
                rows={2}
                placeholder="例: 主人公が特定の選択をした場合"
              />
            )}
          </div>

          <div className="flex justify-end space-x-3 mt-8">
            <Button type="button" variant="secondary" onClick={onClose}>
              キャンセル
            </Button>
            <Button type="submit" variant="primary">
              {eventToEdit ? '更新' : '作成'}
            </Button>
          </div>
        </form>
      </Card>
      <ConfirmModal
        isOpen={isAlertOpen}
        title={alertMessage.toString().includes("時系列の矛盾") ? "時系列の矛盾" : "入力エラー"}
        message={alertMessage}
        onConfirm={() => setIsAlertOpen(false)} 
      />
    </>
  );
};
