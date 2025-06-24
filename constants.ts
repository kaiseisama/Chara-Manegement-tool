
import { Tab, TabKey } from './types';

export const TABS: Tab[] = [
  { key: TabKey.CHARACTERS, label: "キャラクター" },
  { key: TabKey.RELATIONSHIPS, label: "関係性" },
  { key: TabKey.LOCATIONS, label: "場所" },
  { key: TabKey.LORE, label: "世界設定" },
  { key: TabKey.ROUTES, label: "ルート" }, // New tab
];

export const GENDER_OPTIONS = [
  { value: "男性", label: "男性" },
  { value: "女性", label: "女性" },
  { value: "ノンバイナリ", label: "ノンバイナリ" },
  { value: "その他", label: "その他" },
  { value: "不明", label: "不明" },
];
