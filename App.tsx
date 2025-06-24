
import React, { useState, useCallback } from 'react';
import { CharactersSection } from './components/sections/CharactersSection';
import { LocationsSection } from './components/sections/LocationsSection';
import { LoreSection } from './components/sections/LoreSection';
import { RelationshipsSection } from './components/sections/RelationshipsSection';
import { RoutesSection } from './components/sections/RoutesSection';
import { Tab, TabKey, AppState, ActionType } from './types';
import { TABS } from './constants';
import { BookOpenIcon, UsersIcon, MapIcon, LinkIcon, CogIcon, RouteFlowIcon, DownloadIcon, UploadIcon } from './components/common/Icons';
import { useAppData } from './contexts/AppDataContext';
import { Button } from './components/common/Button';
import { ConfirmModal } from './components/common/ConfirmModal';


const IconMap: Record<TabKey, React.ReactNode> = {
  [TabKey.CHARACTERS]: <UsersIcon className="w-5 h-5 mr-2" />,
  [TabKey.RELATIONSHIPS]: <LinkIcon className="w-5 h-5 mr-2" />,
  [TabKey.LOCATIONS]: <MapIcon className="w-5 h-5 mr-2" />,
  [TabKey.LORE]: <BookOpenIcon className="w-5 h-5 mr-2" />,
  [TabKey.ROUTES]: <RouteFlowIcon className="w-5 h-5 mr-2" />,
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>(TabKey.CHARACTERS);
  const { state: appState, dispatch } = useAppData();
  const [isImportConfirmOpen, setIsImportConfirmOpen] = useState(false);
  const [importDataContent, setImportDataContent] = useState<AppState | null>(null);


  const renderContent = () => {
    switch (activeTab) {
      case TabKey.CHARACTERS:
        return <CharactersSection />;
      case TabKey.LOCATIONS:
        return <LocationsSection />;
      case TabKey.LORE:
        return <LoreSection />;
      case TabKey.RELATIONSHIPS:
        return <RelationshipsSection />;
      case TabKey.ROUTES:
        return <RoutesSection />;
      default:
        return null;
    }
  };

  const handleExportData = useCallback(() => {
    try {
      const jsonData = JSON.stringify(appState, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'rpg_character_tool_data_v2.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert('データがエクスポートされました。');
    } catch (error) {
      console.error("Error exporting data:", error);
      alert('データのエクスポート中にエラーが発生しました。');
    }
  }, [appState]);

  const handleImportFileSelected = (event: Event) => {
    const inputElement = event.target as HTMLInputElement;
    const file = inputElement.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error('ファイルの読み取りに失敗しました。');
        }
        const parsedData = JSON.parse(text);

        // Basic validation
        if (
          parsedData &&
          typeof parsedData === 'object' &&
          Array.isArray(parsedData.characters) &&
          Array.isArray(parsedData.locations) &&
          Array.isArray(parsedData.loreEntries) &&
          Array.isArray(parsedData.relationships) &&
          Array.isArray(parsedData.routeEvents)
        ) {
          setImportDataContent(parsedData as AppState);
          setIsImportConfirmOpen(true);
        } else {
          alert('ファイルの形式が無効です。有効なエクスポートファイルを選択してください。');
          setImportDataContent(null);
        }
      } catch (error) {
        console.error("Error importing data:", error);
        alert(`データのインポート中にエラーが発生しました。\n${(error as Error).message}`);
        setImportDataContent(null);
      } finally {
        // Reset file input to allow selecting the same file again if needed
        inputElement.value = ''; 
      }
    };
    reader.readAsText(file);
  };
  
  const handleImportDataTrigger = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = handleImportFileSelected;
    input.click();
  };

  const confirmImport = () => {
    if (importDataContent) {
      dispatch({ type: ActionType.LOAD_STATE, payload: importDataContent });
      alert('データが正常にインポートされました。');
    }
    setIsImportConfirmOpen(false);
    setImportDataContent(null);
  };

  const cancelImport = () => {
    setIsImportConfirmOpen(false);
    setImportDataContent(null);
  };


  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-6 lg:p-8 flex flex-col">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-sky-400 flex items-center justify-center">
          <CogIcon className="w-10 h-10 mr-3 text-sky-500" />
          キャラ管理ツール
        </h1>
        <p className="text-slate-400 mt-2">あなたの創り出す複雑な世界と、そこに住まう魂を記録しましょう。</p>
      </header>

      <nav className="mb-8">
        <ul className="flex flex-wrap border-b border-slate-700">
          {TABS.map((tab: Tab) => (
            <li key={tab.key} className="-mb-px mr-1">
              <button
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center justify-center py-3 px-4 font-medium text-sm sm:text-base border-b-2 transition-colors duration-150 ease-in-out
                  ${activeTab === tab.key
                    ? 'border-sky-500 text-sky-400'
                    : 'border-transparent text-slate-400 hover:text-sky-300 hover:border-sky-400'
                  }`}
                aria-current={activeTab === tab.key ? "page" : undefined}
              >
                {IconMap[tab.key]}
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <main className="flex-grow">
        {renderContent()}
      </main>

      <footer className="mt-12 py-6 border-t border-slate-700 text-center text-sm text-slate-500">
        <div className="flex justify-center items-center space-x-4">
          <Button onClick={handleExportData} variant="secondary" className="flex items-center">
            <DownloadIcon className="w-5 h-5 mr-2" />
            データをエクスポート
          </Button>
          <Button onClick={handleImportDataTrigger} variant="secondary" className="flex items-center">
             <UploadIcon className="w-5 h-5 mr-2" />
            データをインポート
          </Button>
        </div>
        <p className="mt-4">&copy; {new Date().getFullYear()} RPG Character Management Tool</p>
      </footer>

      <ConfirmModal
        isOpen={isImportConfirmOpen}
        title="データインポートの確認"
        message={<>
          <p>選択したファイルからデータをインポートします。</p>
          <p className="font-bold text-orange-400 mt-2">現在の全てのデータが上書きされます。この操作は元に戻せません。</p>
          <p className="mt-2">本当に続行しますか？</p>
        </>}
        onConfirm={confirmImport}
        onCancel={cancelImport}
        confirmText="インポート実行"
        cancelText="キャンセル"
        confirmButtonVariant="danger"
      />
    </div>
  );
};

export default App;
