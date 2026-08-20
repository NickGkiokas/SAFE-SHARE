import React from "react";
import { SCREENS } from "../types";
import { useAuth } from "../context/AuthContext";
import { Home, Search, PlusCircle } from "lucide-react"; 

// ==========================================
// ΤΟ CUSTOM ΕΙΚΟΝΙΔΙΟ ΓΙΑ ΤΟ SAFEZONE
// ==========================================
const CustomSafeZoneIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
  >
    <path 
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
    />
    <circle cx="12" cy="10" r="3" fill="currentColor"/>
  </svg>
);

export default function BottomNav({ current, onNavigate }: any) {
  const { user } = useAuth();
  
  // Παίρνουμε το Avatar του χρήστη (το emoji που έχει επιλέξει πχ 🦉) ή το default 👤
  const userAvatar = user?.photoURL || "👤"; 

  const NavBtn = ({ screen, icon, label, badge, isProfile }: any) => {
    const isActive = current === screen;
    
    return (
      <button 
        onClick={() => onNavigate(screen)}
        className={`flex flex-col items-center justify-center h-full transition-all duration-300 relative w-16 ${
          isActive ? "text-emerald-400 -translate-y-1" : "text-slate-500 hover:text-slate-300"
        }`}
      >
        <div className="relative flex flex-col items-center">
            {/* Αν είναι το Προφίλ, δείχνουμε ΚΑΘΑΡΟ το Emoji μέσα στο πλαίσιο */}
            {isProfile ? (
                <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-lg transition-all ${
                    isActive 
                    ? "border-emerald-400 bg-emerald-400/10 shadow-[0_0_15px_rgba(16,185,129,0.4)]" 
                    : "border-white/10 bg-white/5 shadow-inner text-slate-400"
                }`}>
                    {userAvatar}
                </div>
            ) : (
                // Αλλιώς δείχνουμε το διανυσματικό εικονίδιο (Lucide ή Custom)
                <span className={`transition-all ${isActive ? "drop-shadow-[0_0_10px_rgba(52,211,153,0.6)]" : "opacity-80"}`}>
                    {icon}
                </span>
            )}

            {/* Notification Badge */}
            {badge > 0 && (
                <div className="absolute -top-1 -right-2 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-bounce border border-slate-950 shadow-md">
                    {badge > 9 ? "9+" : badge}
                </div>
            )}
        </div>
        <span className={`text-[10px] font-bold tracking-wide mt-1 transition-opacity ${isActive ? "opacity-100" : "opacity-0"}`}>{label}</span>
      </button>
    );
  };

  return (
    <div className="bg-slate-950/80 backdrop-blur-2xl border-t border-white/5 h-16 flex justify-around items-center fixed bottom-0 left-0 right-0 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
      <NavBtn screen={SCREENS.HOME} icon={<Home className="w-6 h-6" />} label="Ροή" />
      <NavBtn screen={SCREENS.SEARCH} icon={<Search className="w-6 h-6" />} label="Αναζήτηση" /> 
      <NavBtn screen={SCREENS.CREATE} icon={<PlusCircle className="w-7 h-7" />} label="Νέα" />
      
      {/* Το Custom Trademark εικονίδιο για το SafeZone */}
      <NavBtn screen={SCREENS.SAFE_ZONE} icon={<CustomSafeZoneIcon className="w-6 h-6" />} label="SafeZone" />
      
      <NavBtn screen={SCREENS.PROFILE} label="Προφίλ" isProfile={true} />
    </div>
  );
}