import { Activity, Bell, Settings, TrendingUp, Wallet, BarChart3 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { GameSelector } from './GameSelector';
import { cn } from '@/lib/utils';

export function Header() {
  const location = useLocation();
  
  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
      <div className="h-full px-4 lg:px-6 flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-profit flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="hidden md:block">
              <h1 className="font-bold text-lg tracking-tight">
                TCG <span className="text-primary">Arbitrage</span>
              </h1>
              <p className="text-xs text-muted-foreground">Terminal v1.0</p>
            </div>
          </Link>
        </div>

        {/* Navigation - Center */}
        <div className="flex-1 flex items-center justify-center gap-6">
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                location.pathname === "/"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              Arbitrage
            </Link>
            <Link
              to="/trends"
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
                location.pathname === "/trends"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              <BarChart3 className="w-4 h-4" />
              Trends
            </Link>
          </nav>
          <GameSelector />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Stats Pills */}
          <div className="hidden lg:flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-profit/10 border border-profit/20">
              <Activity className="w-3.5 h-3.5 text-profit" />
              <span className="text-xs font-mono text-profit">+$2,847</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-border">
              <Wallet className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-mono">$15,230</span>
            </div>
          </div>

          {/* Notification */}
          <button className={cn(
            "relative w-10 h-10 rounded-lg flex items-center justify-center",
            "bg-secondary/50 hover:bg-secondary border border-border",
            "transition-colors duration-150"
          )}>
            <Bell className="w-4 h-4 text-muted-foreground" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-profit text-[10px] font-bold flex items-center justify-center text-profit-foreground">
              3
            </span>
          </button>

          {/* Settings */}
          <Link 
            to="/settings"
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              "bg-secondary/50 hover:bg-secondary border border-border",
              "transition-colors duration-150",
              location.pathname === "/settings" && "bg-primary/10 border-primary/20"
            )}
          >
            <Settings className={cn(
              "w-4 h-4",
              location.pathname === "/settings" ? "text-primary" : "text-muted-foreground"
            )} />
          </Link>
        </div>
      </div>
    </header>
  );
}
