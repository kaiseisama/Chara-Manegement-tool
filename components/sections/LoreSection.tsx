
import React, { useState, useMemo } from 'react';
import { useAppData } from '../../contexts/AppDataContext';
import { LoreForm } from '../lore/LoreForm';
import { LoreCard } from '../lore/LoreCard';
import { Button } from '../common/Button';
import { LoreEntry } from '../../types';
import { PlusCircleIcon, BookOpenIcon } from '../common/Icons';
import { Input } from '../common/Input';

export const LoreSection: React.FC = () => {
  const { state } = useAppData();
  const [showForm, setShowForm] = useState(false);
  const [editingLoreEntry, setEditingLoreEntry] = useState<LoreEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');


  const handleAddNew = () => {
    setEditingLoreEntry(null);
    setShowForm(true);
  };

  const handleEdit = (loreEntry: LoreEntry) => {
    setEditingLoreEntry(loreEntry);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingLoreEntry(null);
  };
  
  const categories = useMemo(() => {
    const allCategories = state.loreEntries.map(le => le.category);
    return ['', ...Array.from(new Set(allCategories))].sort(); // Add "All" option and sort
  }, [state.loreEntries]);

  const filteredLoreEntries = useMemo(() => {
    return state.loreEntries.filter(entry => {
      const matchesSearch = entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            entry.content.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory ? entry.category === filterCategory : true;
      return matchesSearch && matchesCategory;
    });
  }, [state.loreEntries, searchTerm, filterCategory]);


  return (
    <section>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-semibold text-sky-400 flex items-center">
          <BookOpenIcon className="w-7 h-7 mr-2"/>
          世界設定管理
        </h2>
        <Button onClick={handleAddNew} variant="primary" className="flex items-center w-full sm:w-auto">
          <PlusCircleIcon className="w-5 h-5 mr-2" />
          新規設定項目
        </Button>
      </div>

      {showForm && (
        <LoreForm 
          loreEntryToEdit={editingLoreEntry} 
          onClose={handleCloseForm} 
        />
      )}

      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input 
            id="loreSearch" 
            label="検索"
            placeholder="タイトルや内容で検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="flex flex-col">
            <label htmlFor="categoryFilter" className="block text-sm font-medium text-slate-300 mb-1">カテゴリーフィルター</label>
            <select
                id="categoryFilter"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full p-2.5 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 text-slate-50"
            >
                {categories.map(cat => (
                    <option key={cat} value={cat}>{cat === '' ? '全カテゴリー' : cat}</option>
                ))}
            </select>
        </div>
      </div>

      {filteredLoreEntries.length === 0 && !showForm ? (
        <p className="text-slate-400 text-center py-8">設定項目がありません。最初の項目を追加しましょう！</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLoreEntries.map(loreEntry => (
            <LoreCard key={loreEntry.id} loreEntry={loreEntry} onEdit={handleEdit} />
          ))}
        </div>
      )}
    </section>
  );
};
    