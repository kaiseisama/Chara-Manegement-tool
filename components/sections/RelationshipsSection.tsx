
import React, { useState, useMemo } from 'react';
import { useAppData } from '../../contexts/AppDataContext';
import { RelationshipForm } from '../relationships/RelationshipForm';
import { RelationshipCard } from '../relationships/RelationshipCard';
import { Button } from '../common/Button';
import { Relationship, Character, RouteEvent } from '../../types';
import { PlusCircleIcon, LinkIcon } from '../common/Icons';
import { Select } from '../common/Select'; 

export const RelationshipsSection: React.FC = () => {
  const { state } = useAppData();
  const [showForm, setShowForm] = useState(false);
  const [editingRelationship, setEditingRelationship] = useState<Relationship | null>(null);
  const [filterCharId, setFilterCharId] = useState<string>('');
  const [filterRouteEventId, setFilterRouteEventId] = useState<string>('');


  const handleAddNew = () => {
    if (state.characters.length < 2) {
      alert("関係性を作成するには、少なくとも2人のキャラクターが必要です。");
      return;
    }
    setEditingRelationship(null);
    setShowForm(true);
  };

  const handleEdit = (relationship: Relationship) => {
    setEditingRelationship(relationship);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingRelationship(null);
  };

  const characterOptionsForFilter = useMemo(() => {
    return [
      { value: '', label: '全キャラクター'}, 
      ...state.characters.map((char: Character) => ({ value: char.id, label: char.name }))
    ];
  }, [state.characters]);

  const routeEventOptionsForFilter = useMemo(() => {
    return [
      { value: '', label: '全ルートイベント'},
      ...state.routeEvents.map((event: RouteEvent) => ({ value: event.id, label: event.title }))
    ];
  }, [state.routeEvents]);


  const filteredRelationships = useMemo(() => {
    let relationships = state.relationships;
    if (filterCharId) {
      relationships = relationships.filter(rel => rel.char1Id === filterCharId || rel.char2Id === filterCharId);
    }
    if (filterRouteEventId) {
      relationships = relationships.filter(rel => (rel.relevantRouteEventIds || []).includes(filterRouteEventId));
    }
    return relationships;
  }, [state.relationships, filterCharId, filterRouteEventId]);

  return (
    <section>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-semibold text-sky-400 flex items-center">
          <LinkIcon className="w-7 h-7 mr-2"/>
          関係性管理
        </h2>
        <Button onClick={handleAddNew} variant="primary" className="flex items-center w-full sm:w-auto" disabled={state.characters.length < 2}>
          <PlusCircleIcon className="w-5 h-5 mr-2" />
          新規関係性
        </Button>
      </div>
      
      {state.characters.length < 2 && !showForm && (
         <p className="text-orange-400 text-center py-4 bg-slate-800 rounded-md">
           関係性を作成するには、キャラクタータブで少なくとも2人のキャラクターを登録してください。
         </p>
      )}

      {showForm && (
        <RelationshipForm 
          relationshipToEdit={editingRelationship} 
          onClose={handleCloseForm} 
        />
      )}
      
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
            id="characterFilter"
            label="キャラクターでフィルター"
            options={characterOptionsForFilter}
            value={filterCharId}
            onChange={(e) => setFilterCharId(e.target.value)}
            className={state.characters.length === 0 ? "opacity-50 cursor-not-allowed" : ""}
            disabled={state.characters.length === 0}
        />
        <Select
            id="routeEventFilter"
            label="ルートイベントでフィルター"
            options={routeEventOptionsForFilter}
            value={filterRouteEventId}
            onChange={(e) => setFilterRouteEventId(e.target.value)}
            className={state.routeEvents.length === 0 ? "opacity-50 cursor-not-allowed" : ""}
            disabled={state.routeEvents.length === 0}
        />
      </div>


      {filteredRelationships.length === 0 && !showForm ? (
         (state.characters.length >=2 || state.routeEvents.length > 0) && <p className="text-slate-400 text-center py-8">該当する関係性が登録されていません。</p>
      ) : (
        <div className="space-y-4">
          {filteredRelationships.map(relationship => (
            <RelationshipCard key={relationship.id} relationship={relationship} onEdit={handleEdit} />
          ))}
        </div>
      )}
    </section>
  );
};
