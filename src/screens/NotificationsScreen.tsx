import React, { useState } from "react";
import { useData } from "../context/DataContext";

const getShortId = (uid: string) => uid ? uid.slice(-4).toUpperCase() : "Guest";

export default function NotificationsScreen({ onNavigate, onOpenExperience }: any) {
  const { notifications, markAsRead, markAllAsRead, experiences, refreshNotifications } = useData(); 
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    refreshNotifications(); 
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handleClick = (notif: any) => {
    if (!notif.read) markAsRead(notif.id);
    const exp = experiences.find(e => e.id === notif.expId);
    if (exp) {
      onOpenExperience(exp); 
    } else {
      setShowErrorModal(true);
    }
  };

  return (
    // ✅ Premium Gradient Background
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-950 via-slate-900/90 to-emerald-950/20 absolute inset-0 z-20 overflow-y-auto pb-20">
      
      {/* ✅ Glassy Header */}
      <div className="px-4 py-4 border-b border-white/5 bg-white/5 backdrop-blur-xl sticky top-0 z-10 flex items-center justify-between gap-2 shadow-sm">
        <div className="flex items-center gap-3 w-full justify-between">
            <button 
                onClick={() => markAllAsRead()} 
                className="text-[11px] font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-2xl border border-emerald-500/20 transition-all backdrop-blur-md shadow-sm flex items-center gap-1.5 whitespace-nowrap active:scale-95"
            >
                <span>✓</span><span>Διαβασμένα</span>
            </button>
            <button 
                onClick={handleRefresh} 
                disabled={isRefreshing} 
                className={`h-9 rounded-2xl border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 backdrop-blur-md transition-all duration-300 flex items-center justify-center shadow-sm active:scale-95 ${isRefreshing ? "w-9 px-0" : "px-4 w-auto gap-2"}`}
            >
                <span className={`text-base leading-none ${isRefreshing ? "animate-spin text-emerald-400" : ""}`}>↻</span>
                {!isRefreshing && <span className="text-[11px] font-bold tracking-wide">Ανανέωση</span>}
            </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {notifications.length === 0 ? (
          <div className="text-center py-16 text-slate-500 animate-fade-in">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10 shadow-inner">
                  <span className="text-4xl grayscale opacity-50">🔕</span>
              </div>
              <p className="text-sm font-medium">Καμία νέα ειδοποίηση.</p>
              <p className="text-xs text-slate-600 mt-1">Εδώ θα εμφανίζονται τα σχόλια στα posts σου.</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div 
              key={notif.id}
              onClick={() => handleClick(notif)}
              className={`p-5 rounded-[2rem] border flex gap-4 cursor-pointer active:scale-95 transition-all duration-300 relative overflow-hidden backdrop-blur-md ${
                notif.read 
                    ? "bg-black/20 border-white/5 opacity-70 grayscale-[0.3] hover:bg-black/30 hover:border-white/10" 
                    : "bg-white/5 border-emerald-500/30 shadow-[0_8px_30px_rgba(16,185,129,0.15)] hover:bg-white/10 hover:border-emerald-500/50"
              }`}
            >
               {/* ✅ Glowing Unread Indicator */}
               {!notif.read && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,1)]"></div>}
              
              {/* Glassy Icons */}
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 shadow-inner border 
                ${notif.type === 'help' ? "bg-pink-500/10 text-pink-400 border-pink-500/20" : 
                  notif.type === 'reply' ? "bg-purple-500/10 text-purple-400 border-purple-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"}`}>
                {notif.type === 'help' ? "❤️" : notif.type === 'reply' ? "↩" : "💬"}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200 leading-tight">
                  <span className="font-bold text-emerald-400">Μέλος #{getShortId(notif.fromUid)}</span>
                  {notif.type === 'help' ? " βρήκε βοηθητικό το σχόλιό σου:" : 
                   notif.type === 'reply' ? " απάντησε:" : " σχολίασε:"}
                </p>
                <p className={`text-xs mt-2 italic line-clamp-2 leading-relaxed ${notif.read ? "text-slate-500" : "text-slate-300"}`}>
                    "{notif.text}"
                </p>
                <p className="text-[10px] text-slate-500 mt-3 font-medium uppercase tracking-widest">
                    {notif.createdAt?.seconds ? new Date(notif.createdAt.seconds * 1000).toLocaleDateString() : 'Τώρα'}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ✅ Premium Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-lg animate-fade-in">
            <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/10 p-8 rounded-[2.5rem] w-full max-w-sm shadow-2xl transform scale-100 transition-all text-center">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 text-3xl mb-5 mx-auto border border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                    ⚠️
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Δεν βρέθηκε</h3>
                <p className="text-slate-400 text-sm mb-8 leading-relaxed">Φαίνεται πως αυτή η εμπειρία έχει διαγραφεί από τον χρήστη.</p>
                <button 
                    onClick={() => setShowErrorModal(false)} 
                    className="w-full py-4 rounded-2xl bg-white/10 text-white font-bold text-sm hover:bg-white/20 transition border border-white/10 backdrop-blur-sm"
                >
                    Κατάλαβα
                </button>
            </div>
        </div>
      )}
    </div>
  );
}