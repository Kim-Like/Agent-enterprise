import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Game {
  id: string;
  name: string;
  shortName: string;
  color: string;
}

export const GAMES: Game[] = [
  { id: 'mtg', name: 'Magic: The Gathering', shortName: 'MTG', color: '#B8860B' },
  { id: 'pokemon', name: 'Pokémon', shortName: 'PKM', color: '#FFCB05' },
  { id: 'yugioh', name: 'Yu-Gi-Oh!', shortName: 'YGO', color: '#7B1FA2' },
  { id: 'onepiece', name: 'One Piece', shortName: 'OP', color: '#E53935' },
  { id: 'lorcana', name: 'Disney Lorcana', shortName: 'LOR', color: '#1E88E5' },
  { id: 'fab', name: 'Flesh and Blood', shortName: 'FAB', color: '#C62828' },
  { id: 'starwars', name: 'Star Wars Unlimited', shortName: 'SWU', color: '#FDD835' },
  { id: 'digimon', name: 'Digimon', shortName: 'DGM', color: '#00ACC1' },
  { id: 'dbs', name: 'Dragon Ball Super', shortName: 'DBS', color: '#FF6F00' },
  { id: 'weiss', name: 'Weiss Schwarz', shortName: 'WS', color: '#EC407A' },
];

interface GameStore {
  selectedGame: Game;
  setSelectedGame: (game: Game) => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      selectedGame: GAMES[0],
      setSelectedGame: (game) => set({ selectedGame: game }),
    }),
    {
      name: 'tcg-arbitrage-game',
    }
  )
);
