
import React, { useState, useEffect } from 'react';
import { Location, ActionType }from '../../types';
import { useAppData } from '../../contexts/AppDataContext';
import { Input } from '../common/Input';
import { Textarea } from '../common/Textarea';
import { Button } from '../common/Button';
import { Card } from '../common/Card';

interface LocationFormProps {
  locationToEdit?: Location | null;
  onClose: () => void;
}

const initialFormState: Omit<Location, 'id'> = {
  name: '',
  description: '',
  mapImageUrl: '',
};

export const LocationForm: React.FC<LocationFormProps> = ({ locationToEdit, onClose }) => {
  const [formData, setFormData] = useState<Omit<Location, 'id'>>(initialFormState);
  const { dispatch } = useAppData();

  useEffect(() => {
    if (locationToEdit) {
      setFormData({
        name: locationToEdit.name,
        description: locationToEdit.description,
        mapImageUrl: locationToEdit.mapImageUrl || '',
      });
    } else {
      setFormData(initialFormState);
    }
  }, [locationToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
        alert("場所名は必須です。");
        return;
    }
    if (locationToEdit) {
      dispatch({ type: ActionType.UPDATE_LOCATION, payload: { ...locationToEdit, ...formData } });
    } else {
      const newLocation: Location = {
        id: Date.now().toString() + Math.random().toString(36).substring(2,9),
        ...formData,
      };
      dispatch({ type: ActionType.ADD_LOCATION, payload: newLocation });
    }
    onClose();
  };

  return (
    <Card className="mb-6">
      <h3 className="text-xl font-semibold text-sky-400 mb-4">
        {locationToEdit ? '場所編集' : '新規場所作成'}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input id="name" name="name" label="場所名" value={formData.name} onChange={handleChange} required />
        <Textarea id="description" name="description" label="説明" value={formData.description} onChange={handleChange} />
        <Input id="mapImageUrl" name="mapImageUrl" label="地図画像URL (任意)" value={formData.mapImageUrl} onChange={handleChange} placeholder="https://picsum.photos/400/300" />
        <div className="flex justify-end space-x-3 mt-6">
          <Button type="button" variant="secondary" onClick={onClose}>
            キャンセル
          </Button>
          <Button type="submit" variant="primary">
            {locationToEdit ? '更新' : '作成'}
          </Button>
        </div>
      </form>
    </Card>
  );
};
    