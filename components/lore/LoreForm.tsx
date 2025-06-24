
import React, { useState, useEffect } from 'react';
import { LoreEntry, ActionType } from '../../types';
import { useAppData } from '../../contexts/AppDataContext';
import { Input } from '../common/Input';
import { Textarea } from '../common/Textarea';
import { Button } from '../common/Button';
import { Card } from '../common/Card';

interface LoreFormProps {
  loreEntryToEdit?: LoreEntry | null;
  onClose: () => void;
}

const initialFormState: Omit<LoreEntry, 'id'> = {
  title: '',
  category: '',
  content: '',
};

export const LoreForm: React.FC<LoreFormProps> = ({ loreEntryToEdit, onClose }) => {
  const [formData, setFormData] = useState<Omit<LoreEntry, 'id'>>(initialFormState);
  const { dispatch } = useAppData();

  useEffect(() => {
    if (loreEntryToEdit) {
      setFormData({
        title: loreEntryToEdit.title,
        category: loreEntryToEdit.category,
        content: loreEntryToEdit.content,
      });
    } else {
      setFormData(initialFormState);
    }
  }, [loreEntryToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
     if (!formData.title || !formData.category) {
        alert("タイトルとカテゴリーは必須です。");
        return;
    }
    if (loreEntryToEdit) {
      dispatch({ type: ActionType.UPDATE_LORE_ENTRY, payload: { ...loreEntryToEdit, ...formData } });
    } else {
      const newLoreEntry: LoreEntry = {
        id: Date.now().toString() + Math.random().toString(36).substring(2,9),
        ...formData,
      };
      dispatch({ type: ActionType.ADD_LORE_ENTRY, payload: newLoreEntry });
    }
    onClose();
  };

  return (
    <Card className="mb-6">
      <h3 className="text-xl font-semibold text-sky-400 mb-4">
        {loreEntryToEdit ? '世界設定編集' : '新規世界設定作成'}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input id="title" name="title" label="タイトル" value={formData.title} onChange={handleChange} required />
        <Input id="category" name="category" label="カテゴリー" value={formData.category} onChange={handleChange} placeholder="例: 歴史, 文化, 魔法体系" required />
        <Textarea id="content" name="content" label="内容" value={formData.content} onChange={handleChange} rows={6} />
        <div className="flex justify-end space-x-3 mt-6">
          <Button type="button" variant="secondary" onClick={onClose}>
            キャンセル
          </Button>
          <Button type="submit" variant="primary">
            {loreEntryToEdit ? '更新' : '作成'}
          </Button>
        </div>
      </form>
    </Card>
  );
};
    