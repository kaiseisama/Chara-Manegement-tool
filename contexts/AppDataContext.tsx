
import React, { createContext, useReducer, useContext, useCallback, ReactNode, useEffect } from 'react';
import { AppState, AppAction, ActionType, Character, AppContextProps, RouteEvent, Relationship } from '../types';

const LOCAL_STORAGE_KEY = 'RPG_CHARACTER_TOOL_DATA_V2'; // Changed key to potentially reset if old V1 exists

const getInitialState = (): AppState => {
  try {
    const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      // Basic validation for structure. More robust validation/migration could be added.
      if (
        parsedData &&
        typeof parsedData === 'object' &&
        Array.isArray(parsedData.characters) &&
        Array.isArray(parsedData.locations) &&
        Array.isArray(parsedData.loreEntries) &&
        Array.isArray(parsedData.relationships) &&
        Array.isArray(parsedData.routeEvents)
      ) {
        console.log("Loaded state from localStorage:", parsedData);
        return parsedData as AppState;
      } else {
        console.warn("Malformed data in localStorage. Using default initial state.");
        localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear malformed data
      }
    }
  } catch (error) {
    console.error("Error reading state from localStorage:", error);
    localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear potentially corrupted data
  }
  console.log("Using default initial state because no valid data found in localStorage.");
  return {
    characters: [],
    locations: [],
    loreEntries: [],
    relationships: [],
    routeEvents: [],
  };
};


const AppContext = createContext<AppContextProps | undefined>(undefined);

const appReducer = (state: AppState, action: AppAction): AppState => {
  console.log("Action dispatched:", action.type, "Payload:", (action as any).payload);
  switch (action.type) {
    // Character Actions
    case ActionType.ADD_CHARACTER:
      return { ...state, characters: [...state.characters, action.payload] };
    case ActionType.UPDATE_CHARACTER:
      return {
        ...state,
        characters: state.characters.map(c => c.id === action.payload.id ? action.payload : c),
      };
    case ActionType.DELETE_CHARACTER: {
      const characterIdToDelete = action.payload;
      console.log(`[Reducer] Attempting to delete character with id: "${characterIdToDelete}" (Type: ${typeof characterIdToDelete})`);
      const newCharacters = state.characters.filter(c => c.id !== characterIdToDelete);
      if (newCharacters.length < state.characters.length) {
        console.log(`[Reducer] Character "${characterIdToDelete}" REMOVED.`);
      } else {
        console.warn(`[Reducer] Character "${characterIdToDelete}" NOT FOUND for deletion.`);
      }
      const updatedRelationships = state.relationships.filter(
        r => r.char1Id !== characterIdToDelete && r.char2Id !== characterIdToDelete
      );
      // Also remove characterId from routeEvents characterIds
      const updatedRouteEventsForCharDelete = state.routeEvents.map(re => ({
        ...re,
        characterIds: re.characterIds.filter(id => id !== characterIdToDelete),
      }));
      return {
        ...state,
        characters: newCharacters,
        relationships: updatedRelationships,
        routeEvents: updatedRouteEventsForCharDelete,
      };
    }

    // Location Actions
    case ActionType.ADD_LOCATION:
      return { ...state, locations: [...state.locations, action.payload] };
    case ActionType.UPDATE_LOCATION:
      return {
        ...state,
        locations: state.locations.map(l => l.id === action.payload.id ? action.payload : l),
      };
    case ActionType.DELETE_LOCATION: {
      const locationIdToDelete = action.payload;
      console.log(`Attempting to delete location with id: ${locationIdToDelete}`);
      // Also remove locationId from routeEvents locationIds
      const updatedRouteEventsForLocDelete = state.routeEvents.map(re => ({
        ...re,
        locationIds: re.locationIds.filter(id => id !== locationIdToDelete),
      }));
      return {
        ...state,
        locations: state.locations.filter(l => l.id !== locationIdToDelete),
        routeEvents: updatedRouteEventsForLocDelete,
      };
    }
      
    // Lore Actions
    case ActionType.ADD_LORE_ENTRY:
      return { ...state, loreEntries: [...state.loreEntries, action.payload] };
    case ActionType.UPDATE_LORE_ENTRY:
      return {
        ...state,
        loreEntries: state.loreEntries.map(le => le.id === action.payload.id ? action.payload : le),
      };
    case ActionType.DELETE_LORE_ENTRY:
      console.log(`Attempting to delete lore entry with id: ${action.payload}`);
      return {
        ...state,
        loreEntries: state.loreEntries.filter(le => le.id !== action.payload),
      };

    // Relationship Actions
    case ActionType.ADD_RELATIONSHIP:
      return { ...state, relationships: [...state.relationships, action.payload] };
    case ActionType.UPDATE_RELATIONSHIP:
      return {
        ...state,
        relationships: state.relationships.map(r => r.id === action.payload.id ? action.payload : r),
      };
    case ActionType.DELETE_RELATIONSHIP: {
      const relationshipIdToDelete = action.payload;
      console.log(`[Reducer] Attempting to delete relationship with id: "${relationshipIdToDelete}"`);
      const filteredRelationships = state.relationships.filter(r => r.id !== relationshipIdToDelete);
      if (filteredRelationships.length < state.relationships.length) {
         console.log(`[Reducer] Relationship "${relationshipIdToDelete}" REMOVED.`);
      } else {
         console.warn(`[Reducer] Relationship "${relationshipIdToDelete}" NOT FOUND for deletion.`);
      }
      return {
        ...state,
        relationships: filteredRelationships,
      };
    }

    // Route Event Actions
    case ActionType.ADD_ROUTE_EVENT:
      return { ...state, routeEvents: [...state.routeEvents, action.payload] };
    case ActionType.UPDATE_ROUTE_EVENT:
      return {
        ...state,
        routeEvents: state.routeEvents.map(re => re.id === action.payload.id ? action.payload : re),
      };
    case ActionType.DELETE_ROUTE_EVENT: {
      const routeEventIdToDelete = action.payload;
      console.log(`Attempting to delete route event with id: ${routeEventIdToDelete}`);
      
      const updatedRouteEventsForDelete = state.routeEvents
        .filter(re => re.id !== routeEventIdToDelete)
        .map(re => ({
          ...re,
          parentEventIds: re.parentEventIds.filter(id => id !== routeEventIdToDelete),
          childEventIds: re.childEventIds.filter(id => id !== routeEventIdToDelete),
        }));

      const updatedRelationshipsForRouteEventDelete = state.relationships.map(rel => ({
        ...rel,
        relevantRouteEventIds: (rel.relevantRouteEventIds || []).filter(id => id !== routeEventIdToDelete),
      }));

      return {
        ...state,
        routeEvents: updatedRouteEventsForDelete,
        relationships: updatedRelationshipsForRouteEventDelete,
      };
    }
    case ActionType.LOAD_STATE:
      // This assumes payload is a valid AppState. Validation should happen before dispatching.
      console.log("Loading new state from import:", action.payload);
      return action.payload;
      
    default:
      return state;
  }
};

export const AppDataProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, getInitialState());

  useEffect(() => {
    try {
      console.log("Saving state to localStorage:", state);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Error saving state to localStorage:", error);
    }
  }, [state]);

  const getCharacterById = useCallback((id: string): Character | undefined => {
    return state.characters.find(char => char.id === id);
  }, [state.characters]);


  return (
    <AppContext.Provider value={{ state, dispatch, getCharacterById }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppData = (): AppContextProps => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};