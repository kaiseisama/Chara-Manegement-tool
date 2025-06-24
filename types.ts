
export enum Gender {
  MALE = "男性",
  FEMALE = "女性",
  NON_BINARY = "ノンバイナリ",
  OTHER = "その他",
  UNKNOWN = "不明"
}

export interface Character {
  id: string;
  name: string;
  age: string;
  gender: Gender;
  appearance: string;
  personality: string;
  backstory: string;
  notes?: string;
}

export interface Location {
  id: string;
  name: string;
  description: string;
  mapImageUrl?: string; // Optional field for map image URL
}

export interface LoreEntry {
  id: string;
  title: string;
  category: string;
  content: string;
}

export interface Relationship {
  id:string;
  char1Id: string;
  char2Id: string;
  char1CallsChar2: string; // How character 1 calls character 2
  char2CallsChar1: string; // How character 2 calls character 1
  description: string; // Description of their relationship
  relevantRouteEventIds?: string[]; // IDs of route events this relationship is particularly relevant to or active in
}

export interface RouteEvent {
  id: string;
  title: string;
  description: string;
  dateTime?: string; // Optional: Date/time of the event
  characterIds: string[]; // Characters involved
  locationIds: string[]; // Locations involved
  parentEventIds: string[]; // IDs of preceding events
  childEventIds: string[]; // IDs of succeeding events
  isBranchPoint?: boolean; // Is this a branching point in the story?
  branchCondition?: string; // Condition for this branch (if isBranchPoint is true)
}

export enum TabKey {
  CHARACTERS = "characters",
  RELATIONSHIPS = "relationships",
  LOCATIONS = "locations",
  LORE = "lore",
  ROUTES = "routes", // New tab key for routes
}

export interface Tab {
  key: TabKey;
  label: string;
}

// Context related types
export interface AppState {
  characters: Character[];
  locations: Location[];
  loreEntries: LoreEntry[];
  relationships: Relationship[];
  routeEvents: RouteEvent[]; // New state for route events
}

export enum ActionType {
  ADD_CHARACTER = "ADD_CHARACTER",
  UPDATE_CHARACTER = "UPDATE_CHARACTER",
  DELETE_CHARACTER = "DELETE_CHARACTER",
  ADD_LOCATION = "ADD_LOCATION",
  UPDATE_LOCATION = "UPDATE_LOCATION",
  DELETE_LOCATION = "DELETE_LOCATION",
  ADD_LORE_ENTRY = "ADD_LORE_ENTRY",
  UPDATE_LORE_ENTRY = "UPDATE_LORE_ENTRY",
  DELETE_LORE_ENTRY = "DELETE_LORE_ENTRY",
  ADD_RELATIONSHIP = "ADD_RELATIONSHIP",
  UPDATE_RELATIONSHIP = "UPDATE_RELATIONSHIP",
  DELETE_RELATIONSHIP = "DELETE_RELATIONSHIP",
  ADD_ROUTE_EVENT = "ADD_ROUTE_EVENT", // New action
  UPDATE_ROUTE_EVENT = "UPDATE_ROUTE_EVENT", // New action
  DELETE_ROUTE_EVENT = "DELETE_ROUTE_EVENT", // New action
  LOAD_STATE = "LOAD_STATE", // For importing data
}

export type AppAction =
  | { type: ActionType.ADD_CHARACTER; payload: Character }
  | { type: ActionType.UPDATE_CHARACTER; payload: Character }
  | { type: ActionType.DELETE_CHARACTER; payload: string } // id
  | { type: ActionType.ADD_LOCATION; payload: Location }
  | { type: ActionType.UPDATE_LOCATION; payload: Location }
  | { type: ActionType.DELETE_LOCATION; payload: string } // id
  | { type: ActionType.ADD_LORE_ENTRY; payload: LoreEntry }
  | { type: ActionType.UPDATE_LORE_ENTRY; payload: LoreEntry }
  | { type: ActionType.DELETE_LORE_ENTRY; payload: string } // id
  | { type: ActionType.ADD_RELATIONSHIP; payload: Relationship }
  | { type: ActionType.UPDATE_RELATIONSHIP; payload: Relationship }
  | { type: ActionType.DELETE_RELATIONSHIP; payload: string } // id
  | { type: ActionType.ADD_ROUTE_EVENT; payload: RouteEvent } // New action payload
  | { type: ActionType.UPDATE_ROUTE_EVENT; payload: RouteEvent } // New action payload
  | { type: ActionType.DELETE_ROUTE_EVENT; payload: string } // id, New action payload
  | { type: ActionType.LOAD_STATE; payload: AppState }; // For importing data


export interface AppContextProps {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  getCharacterById: (id: string) => Character | undefined;
  // getLocationById and getRouteEventById might be added later if needed frequently
}