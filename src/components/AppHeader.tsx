import React from "react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { SCREENS } from "../types";
import logo from "../assets/safeshare-logo.png"; 

export default function AppHeader({ screen, onBack }: any) {
  const { user } = useAuth();
  const { unreadCount } = useData();
  
  // Το βελάκι εμφανίζεται αν ΔΕΝ είμαστε Home ΚΑΙ ΔΕΝ είμαστε Profile
  const showBack = screen !== SCREENS.HOME && screen !== SCREENS.PROFILE && screen !== SCREENS.CREATE && screen !== SCREENS.SAFE_ZONE && screen !== SCREENS.SEARCH;

  return (
    <header className="flex items-center justify-between px-4 py-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-10 shrink-0 h-16">
      
      {/* Αριστερό μέρος: Λογότυπο ή Πίσω */}
      <div className="flex items-center gap-3">
        {showBack ? (
          <button 
            onClick={() => onBack(SCREENS.HOME)} 
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700 transition"
          >
            ←
          </button>
        ) : (
           <img src={logo} alt="Logo" className="w-8 h-8 rounded-full object-cover" />
        )}
        
        <div>
          <h1 className="text-lg font-bold tracking-tight text-white">
                    Safe<span className="text-emerald-400">Share</span>
                </h1>
        </div>
      </div>

      {/* Δεξί μέρος: Καμπανάκι (ΜΟΝΟ ΣΤΗ ΡΟΗ/HOME) */}
      {screen === SCREENS.HOME && (
        <button 
            onClick={() => onBack(SCREENS.NOTIFICATIONS)} 
            className="w-9 h-9 rounded-full flex items-center justify-center relative bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 transition"
        >
            <span className="text-lg">🔔</span>
            {unreadCount > 0 && (
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-900 animate-pulse"></span>
            )}
        </button>
      )}
    </header>
  );
}