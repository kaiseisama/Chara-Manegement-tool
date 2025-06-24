
import React, { useState, useMemo } from 'react';
import { useAppData } from '../../contexts/AppDataContext';
import { RouteEventForm } from '../routes/RouteEventForm';
import { RouteEventCard } from '../routes/RouteEventCard';
import { RouteTreeView } from '../routes/RouteTreeView'; // Import new TreeView component
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { RouteEvent } from '../../types';
import { PlusCircleIcon, RouteFlowIcon, TreeIcon, ListBulletIcon } from '../common/Icons'; // Import new icons

type ViewMode = 'list' | 'tree';

export const RoutesSection: React.FC = () => {
  const { state } = useAppData();
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<RouteEvent | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list'); // Default to list view

  const handleAddNew = () => {
    setEditingEvent(null);
    setShowForm(true);
  };

  const handleEdit = (event: RouteEvent) => {
    setEditingEvent(event);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingEvent(null);
  };

  const filteredRouteEvents = useMemo(() => {
    return state.routeEvents.filter(event => 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (event.dateTime && event.dateTime.toLowerCase().includes(searchTerm.toLowerCase()))
    ).sort((a,b) => (a.dateTime || "").localeCompare(b.dateTime || "") || a.title.localeCompare(b.title) );
  }, [state.routeEvents, searchTerm]);

  return (
    <section>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-semibold text-sky-400 flex items-center">
          <RouteFlowIcon className="w-7 h-7 mr-2"/>
          ルート・時系列管理
        </h2>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => setViewMode('list')} 
            variant={viewMode === 'list' ? 'primary' : 'secondary'}
            className="p-2"
            aria-label="リスト表示"
          >
            <ListBulletIcon className="w-5 h-5" />
          </Button>
          <Button 
            onClick={() => setViewMode('tree')} 
            variant={viewMode === 'tree' ? 'primary' : 'secondary'}
            className="p-2"
            aria-label="ツリー表示"
          >
            <TreeIcon className="w-5 h-5" />
          </Button>
          <Button onClick={handleAddNew} variant="primary" className="flex items-center w-full sm:w-auto ml-2">
            <PlusCircleIcon className="w-5 h-5 mr-2" />
            新規ルートイベント
          </Button>
        </div>
      </div>

      {showForm && (
        <RouteEventForm 
          eventToEdit={editingEvent} 
          onClose={handleCloseForm} 
        />
      )}

      {viewMode === 'list' && (
        <>
          <div className="mb-6">
            <Input 
                id="routeSearch" 
                label="検索"
                placeholder="タイトル、説明、日時で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {filteredRouteEvents.length === 0 && !showForm ? (
            <p className="text-slate-400 text-center py-8">ルートイベントがありません。最初のイベントを追加しましょう！</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRouteEvents.map(event => (
                <RouteEventCard key={event.id} routeEvent={event} onEdit={handleEdit} />
              ))}
            </div>
          )}
        </>
      )}

      {viewMode === 'tree' && (
        state.routeEvents.length === 0 && !showForm ? (
             <p className="text-slate-400 text-center py-8">ツリー表示するルートイベントがありません。</p>
        ) : (
             <RouteTreeView events={state.routeEvents} />
        )
      )}
    </section>
  );
};
