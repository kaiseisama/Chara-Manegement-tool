
import React, { useState } from 'react';
import { useAppData } from '../../contexts/AppDataContext';
import { CharacterForm } from '../characters/CharacterForm';
import { CharacterCard } from '../characters/CharacterCard';
import { Button } from '../common/Button';
import { Character } from '../../types';
import { PlusCircleIcon, UsersIcon } from '../common/Icons';

export const CharactersSection: React.FC = () => {
  const { state } = useAppData();
  const [showForm, setShowForm] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);

  const handleAddNew = () => {
    setEditingCharacter(null);
    setShowForm(true);
  };

  const handleEdit = (character: Character) => {
    setEditingCharacter(character);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingCharacter(null);
  };
  
  return (
    <section>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-sky-400 flex items-center">
          <UsersIcon className="w-7 h-7 mr-2"/>
          キャラクター管理
        </h2>
        <Button onClick={handleAddNew} variant="primary" className="flex items-center">
          <PlusCircleIcon className="w-5 h-5 mr-2" />
          新規キャラクター
        </Button>
      </div>

      {showForm && (
        <CharacterForm 
          characterToEdit={editingCharacter} 
          onClose={handleCloseForm} 
        />
      )}

      {state.characters.length === 0 && !showForm ? (
        <p className="text-slate-400 text-center py-8">キャラクターがいません。最初のキャラクターを追加しましょう！</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {state.characters.map(character => (
            <CharacterCard key={character.id} character={character} onEdit={handleEdit} />
          ))}
        </div>
      )}
    </section>
  );
};
    