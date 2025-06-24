
import React, { useState } from 'react';
import { useAppData } from '../../contexts/AppDataContext';
import { LocationForm } from '../locations/LocationForm';
import { LocationCard } from '../locations/LocationCard';
import { Button } from '../common/Button';
import { Location } from '../../types';
import { PlusCircleIcon, MapIcon } from '../common/Icons';

export const LocationsSection: React.FC = () => {
  const { state } = useAppData();
  const [showForm, setShowForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  const handleAddNew = () => {
    setEditingLocation(null);
    setShowForm(true);
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingLocation(null);
  };

  return (
    <section>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-sky-400 flex items-center">
          <MapIcon className="w-7 h-7 mr-2"/>
          場所管理
        </h2>
        <Button onClick={handleAddNew} variant="primary" className="flex items-center">
          <PlusCircleIcon className="w-5 h-5 mr-2" />
          新規場所
        </Button>
      </div>

      {showForm && (
        <LocationForm 
          locationToEdit={editingLocation} 
          onClose={handleCloseForm} 
        />
      )}

      {state.locations.length === 0 && !showForm ? (
        <p className="text-slate-400 text-center py-8">場所が登録されていません。最初の場所を追加しましょう！</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {state.locations.map(location => (
            <LocationCard key={location.id} location={location} onEdit={handleEdit} />
          ))}
        </div>
      )}
    </section>
  );
};
    