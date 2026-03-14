import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Sparkles, Zap, Swords, Anchor, Wand2, Flame, Rocket, CircleDot, Sun, Heart } from 'lucide-react';
import { useGameStore, GAMES, type Game } from '@/stores/gameStore';
import { cn } from '@/lib/utils';

const gameIcons: Record<string, React.ReactNode> = {
  mtg: <Sparkles className="w-4 h-4" />,
  pokemon: <Zap className="w-4 h-4" />,
  yugioh: <Swords className="w-4 h-4" />,
  onepiece: <Anchor className="w-4 h-4" />,
  lorcana: <Wand2 className="w-4 h-4" />,
  fab: <Flame className="w-4 h-4" />,
  starwars: <Rocket className="w-4 h-4" />,
  digimon: <CircleDot className="w-4 h-4" />,
  dbs: <Sun className="w-4 h-4" />,
  weiss: <Heart className="w-4 h-4" />,
};

export function GameSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const { selectedGame, setSelectedGame } = useGameStore();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (game: Game) => {
    setSelectedGame(game);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200",
          "bg-secondary/50 hover:bg-secondary border border-border",
          "hover:border-primary/50 hover:glow-primary",
          isOpen && "border-primary glow-primary"
        )}
      >
        <div 
          className="w-8 h-8 rounded-md flex items-center justify-center"
          style={{ backgroundColor: selectedGame.color + '20', color: selectedGame.color }}
        >
          {gameIcons[selectedGame.id]}
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-xs text-muted-foreground">Active Game</p>
          <p className="font-semibold text-sm">{selectedGame.name}</p>
        </div>
        <span className="sm:hidden font-bold text-sm" style={{ color: selectedGame.color }}>
          {selectedGame.shortName}
        </span>
        <ChevronDown 
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )} 
        />
      </button>

      {isOpen && (
        <div className={cn(
          "absolute top-full left-0 mt-2 w-72 z-50",
          "bg-popover border border-border rounded-xl shadow-2xl",
          "animate-scale-in overflow-hidden"
        )}>
          <div className="p-2 border-b border-border">
            <p className="text-xs text-muted-foreground px-2">Select Trading Card Game</p>
          </div>
          <div className="p-2 max-h-80 overflow-y-auto">
            {GAMES.map((game) => (
              <button
                key={game.id}
                onClick={() => handleSelect(game)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150",
                  "hover:bg-secondary/80",
                  selectedGame.id === game.id && "bg-secondary ring-1 ring-primary"
                )}
              >
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center transition-transform hover:scale-110"
                  style={{ backgroundColor: game.color + '20', color: game.color }}
                >
                  {gameIcons[game.id]}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-sm">{game.name}</p>
                  <p className="text-xs text-muted-foreground">{game.shortName}</p>
                </div>
                {selectedGame.id === game.id && (
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
