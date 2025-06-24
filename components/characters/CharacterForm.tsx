
import React, { useState, useEffect } from 'react';
import { Character, Gender, ActionType } from '../../types';
import { useAppData } from '../../contexts/AppDataContext';
import { Input } from '../common/Input';
import { Textarea } from '../common/Textarea';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { Card } from '../common/Card'; // Added import for Card
import { GENDER_OPTIONS } from '../../constants';

interface CharacterFormProps {
  characterToEdit?: Character | null;
  onClose: () => void;
}

const initialFormState: Omit<Character, 'id'> = {
  name: '',
  age: '',
  gender: Gender.UNKNOWN,
  appearance: '',
  personality: '',
  backstory: '',
  notes: '',
};

export const CharacterForm: React.FC<CharacterFormProps> = ({ characterToEdit, onClose }) => {
  const [formData, setFormData] = useState<Omit<Character, 'id'>>(initialFormState);
  const { dispatch } = useAppData();

  useEffect(() => {
    if (characterToEdit) {
      setFormData({
        name: characterToEdit.name,
        age: characterToEdit.age,
        gender: characterToEdit.gender,
        appearance: characterToEdit.appearance,
        personality: characterToEdit.personality,
        backstory: characterToEdit.backstory,
        notes: characterToEdit.notes || '',
      });
    } else {
      setFormData(initialFormState);
    }
  }, [characterToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
        alert("名前は必須です。"); // Name is required
        return;
    }
    if (characterToEdit) {
      dispatch({ type: ActionType.UPDATE_CHARACTER, payload: { ...characterToEdit, ...formData } });
    } else {
      const newCharacter: Character = {
        id: Date.now().toString() + Math.random().toString(36).substring(2,9),
        ...formData,
      };
      dispatch({ type: ActionType.ADD_CHARACTER, payload: newCharacter });
    }
    onClose();
  };

  return (
    <Card className="mb-6">
      <h3 className="text-xl font-semibold text-sky-400 mb-4">
        {characterToEdit ? 'キャラクター編集' : '新規キャラクター作成'}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input id="name" name="name" label="名前" value={formData.name} onChange={handleChange} required />
        <Input id="age" name="age" label="年齢" value={formData.age} onChange={handleChange} />
        <Select 
          id="gender" 
          name="gender" 
          label="性別" 
          value={formData.gender} 
          onChange={handleChange} 
          options={GENDER_OPTIONS.map(g => ({ value: g.value as Gender, label: g.label }))} 
        />
        <Textarea id="appearance" name="appearance" label="外見" value={formData.appearance} onChange={handleChange} />
        <Textarea id="personality" name="personality" label="性格" value={formData.personality} onChange={handleChange} />
        <Textarea id="backstory" name="backstory" label="背景・経歴" value={formData.backstory} onChange={handleChange} />
        <Textarea id="notes" name="notes" label="備考" value={formData.notes} onChange={handleChange} />
        
        <div className="flex justify-end space-x-3 mt-6">
          <Button type="button" variant="secondary" onClick={onClose}>
            キャンセル
          </Button>
          <Button type="submit" variant="primary">
            {characterToEdit ? '更新' : '作成'}
          </Button>
        </div>
      </form>
    </Card>
  );
};
