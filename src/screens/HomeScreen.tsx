import React, { useState, useMemo } from "react";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import UserProfileModal from "../components/UserProfileModal"; 

const getShortId = (uid: string) => uid ? uid.slice(-4).toUpperCase() : "Guest";
const formatTag = (text: string) => text ? text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase() : "";
const normalizeForSearch = (text: string) => {
  if (!text) return "";
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

const highlightText = (text: string, highlight: string) => {
  if (!highlight.trim()) return text;
  const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escapedHighlight})`, 'gi'));
  return (
    <span>
      {parts.map((part, i) => 
        normalizeForSearch(part) === normalizeForSearch(highlight) ? (
          <span key={i} className="bg-emerald-500/40 text-emerald-100 rounded-sm px-[2px] font-medium">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
};

export default function HomeScreen({ onNavigate, onOpenExperience }: any) {
  const { experiences, isLoading, error, savedPostIds, toggleSavePost } = useData();
  const { user } = useAuth(); 

  const [viewingProfileUid, setViewingProfileUid] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showAllTagsModal, setShowAllTagsModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ✅ Υπολογισμός όλων των διαθέσιμων tags (αντιμετωπίζοντας και arrays και strings)
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    experiences.forEach(exp => {
      if (exp.emotion) {
        const tagsArray = Array.isArray(exp.emotion) ? exp.emotion : [exp.emotion];
        tagsArray.forEach(t => {
            if (t) tags.add(formatTag(t));
        });
      }
    });
    return Array.from(tags);
  }, [experiences]);

  const visibleTags = availableTags.slice(0, 3);
  const hasMoreTags = availableTags.length > 3;

  // ✅ Φιλτράρισμα εμπειριών (Υποστήριξη για πολλαπλά tags)
  const filteredExperiences = experiences.filter((exp) => {
    const term = normalizeForSearch(searchTerm);
    const postTags = Array.isArray(exp.emotion) ? exp.emotion.map(formatTag) : [formatTag(exp.emotion)];
    const postTagsStr = postTags.join(" ").toLowerCase(); // Ενώνουμε τα tags σε string για την αναζήτηση

    // 1. Αναζήτηση κειμένου
    const matchesSearch = !term || (
        normalizeForSearch(exp.title).includes(term) || 
        normalizeForSearch(exp.body).includes(term) ||  
        postTagsStr.includes(term)
    );

    // 2. Φιλτράρισμα με βάση τα επιλεγμένα tags
    // Ένα post περνάει το φίλτρο αν ΔΕΝ έχουμε επιλέξει κανένα tag, 
    // Ή αν ΕΣΤΩ ΕΝΑ από τα tags του post υπάρχει στα επιλεγμένα (selectedTags)
    const matchesTags = selectedTags.length === 0 || postTags.some(tag => selectedTags.includes(tag));
    
    return matchesSearch && matchesTags;
  });

  const handleToggleSave = async (e: React.MouseEvent, expId: string, isSaved: boolean) => {
    e.stopPropagation(); 
    await toggleSavePost(expId);
    
    if (isSaved) {
      setToastMessage("Αφαιρέθηκε από τα αποθηκευμένα σου");
    } else {
      setToastMessage("Προστέθηκε στα αποθηκευμένα σου 🔖");
    }

    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const toggleTag = (tag: string) => {
      setSelectedTags(prev => 
          prev.includes(tag) 
          ? prev.filter(t => t !== tag) 
          : [...prev, tag]              
      );
  };

  const clearTags = () => {
      setSelectedTags([]);
  };

  if (isLoading && experiences.length === 0) return <div className="p-10 text-center text-slate-500">Φόρτωση ροής...</div>;
  if (error) return <div className="p-10 text-center text-red-400">{error}</div>;

  return (
    <div className="h-full w-full overflow-y-auto bg-transparent scrollbar-hide scroll-smooth relative"> 
      
      <div className="sticky top-0 z-30 glass-header pt-4 px-4 pb-3 shadow-lg flex flex-col">
          <h2 className="text-2xl font-extrabold tracking-tight text-white mb-4">
            Πρόσφατες εμπειρίες
          </h2>
          
          <div className="relative mb-3">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-slate-500 text-sm">🔍</span>
              </div>
              <input 
                  type="text"
                  placeholder="Αναζήτηση Εμπειριών..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-2xl py-3 pl-11 pr-4 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 shadow-inner placeholder:text-slate-500 transition-all"
              />
              {searchTerm && (
                  <button onClick={() => setSearchTerm("")} className="absolute inset-y-0 right-0 pr-4 text-slate-500 hover:text-white">✕</button>
              )}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x">
            <button
                onClick={clearTags}
                className={`shrink-0 px-5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all snap-start ${
                    selectedTags.length === 0 ? "bg-emerald-500 text-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.3)]" : "bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10"
                }`}
            >
                Ολα
            </button>
            
            {visibleTags.map(tag => (
                <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`shrink-0 px-5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all snap-start ${
                        selectedTags.includes(tag) ? "bg-emerald-500 text-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.3)]" : "bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10"
                    }`}
                >
                    {tag}
                </button>
            ))}
            
            {hasMoreTags && (
                 <button
                 onClick={() => setShowAllTagsModal(true)}
                 className={`shrink-0 px-5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all snap-start flex items-center gap-1 bg-white/5 text-emerald-400 border border-emerald-500/30 border-dashed hover:bg-white/10 hover:border-emerald-400`}
             >
                 ΠΕΡΙΣΣΟΤΕΡΑ...
             </button>
            )}
          </div>

          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/5 animate-fade-in">
                {selectedTags.map(tag => (
                    <div key={tag} className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 pl-3 pr-1 py-1 rounded-xl text-[10px] font-bold tracking-widest uppercase shadow-sm backdrop-blur-sm">
                        <span>{tag}</span>
                        <button 
                            onClick={(e) => { e.stopPropagation(); toggleTag(tag); }} 
                            className="text-emerald-500 hover:text-white hover:bg-emerald-500/40 rounded-lg w-5 h-5 flex items-center justify-center transition-all ml-1"
                        >
                            ✕
                        </button>
                    </div>
                ))}
            </div>
          )}
      </div>
      
      <div className="p-4 space-y-5 pb-24 relative">
          {filteredExperiences.length > 0 ? (
              filteredExperiences.map((exp) => {
                const isSaved = savedPostIds?.includes(exp.id);
                // ✅ Μετατρέπουμε πάντα το emotion σε Array για ομοιόμορφη απεικόνιση
                const postTags = Array.isArray(exp.emotion) ? exp.emotion : [exp.emotion];

                return (
                  <div key={exp.id} onClick={() => onOpenExperience(exp)} className="glass-card p-5 rounded-[2rem] shadow-lg active:scale-[0.98] transition-all cursor-pointer relative animate-fade-in">
                    <div className="flex justify-between items-start mb-4">
                      
                      {/* ✅ Εμφάνιση πολλών tags στο post */}
                      <div className="flex flex-wrap gap-1">
                          {postTags.map((tag, idx) => tag && (
                            <span key={idx} className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                {formatTag(tag)} 
                            </span>
                          ))}
                      </div>

                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider shrink-0 ml-2">{new Date(exp.createdAt).toLocaleDateString('el-GR')}</span>
                    </div>
                    <h3 className="text-white font-bold text-lg mb-2 leading-tight">{highlightText(exp.title, searchTerm)}</h3>
                    <p className="text-slate-300 text-sm line-clamp-3 leading-relaxed mb-4">{highlightText(exp.body, searchTerm)}</p>
                    
                    <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                      <div className="flex items-center gap-3 group z-10" onClick={(e) => { e.stopPropagation(); setViewingProfileUid(exp.authorUid); }}>
                        <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-base shadow-sm group-hover:border-emerald-500/50 transition-colors">
                          {exp.authorUid === user?.uid ? (user?.photoURL || "👤") : ((exp as any).authorAvatar || "👤")}
                        </div>
                        <span className="text-xs text-slate-400 font-medium group-hover:text-emerald-400 transition-colors">Μέλος <span className="font-bold text-slate-200 group-hover:text-emerald-400">#{getShortId(exp.authorUid)}</span></span>
                      </div>

                      <div className="flex items-center gap-4">
                        <button 
                          onClick={(e) => handleToggleSave(e, exp.id, isSaved)} 
                          className={`text-lg transition-transform active:scale-125`}
                        >
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            viewBox="0 0 24 24" 
                            strokeWidth={1.5} 
                            stroke="currentColor" 
                            className={`w-6 h-6 transition-all ${isSaved ? 'fill-yellow-500 text-yellow-500 drop-shadow-[0_0_6px_rgba(234,179,8,0.5)]' : 'text-slate-500 hover:text-white'}`}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                          </svg>
                        </button>
                        <span className="text-xs font-bold text-slate-400">💬 {exp.comments?.length || 0}</span>
                      </div>
                    </div>
                  </div>
                );
              })
          ) : (
              <div className="text-center py-10 opacity-50 glass-card rounded-[2rem]">
                  <p className="text-slate-300 text-sm font-bold">Δεν βρέθηκαν εμπειρίες.</p>
              </div>
          )}
      </div>

      {toastMessage && (
        <>
          <style>{`
            @keyframes softFadeUp {
              0% { opacity: 0; transform: translate(-50%, 20px) scale(0.95); }
              100% { opacity: 1; transform: translate(-50%, 0) scale(1); }
            }
          `}</style>
          <div 
            className="fixed bottom-24 left-1/2 bg-slate-900/85 backdrop-blur-xl border border-emerald-500/30 text-emerald-400 px-6 py-3 rounded-full text-xs font-bold shadow-[0_10px_30px_rgba(16,185,129,0.25)] z-50 flex items-center gap-2 whitespace-nowrap"
            style={{ animation: "softFadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
          >
            <span>{toastMessage}</span>
          </div>
        </>
      )}

      {showAllTagsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/10 p-6 rounded-[2rem] w-full max-w-sm shadow-2xl relative flex flex-col max-h-[80vh]">
                
                <button onClick={() => setShowAllTagsModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white bg-white/5 rounded-full w-8 h-8 flex items-center justify-center transition-colors shadow-inner">✕</button>

                <h3 className="text-xl font-bold text-white mb-2">Επιλογή Φίλτρων</h3>
                <p className="text-slate-400 text-xs mb-6">Μπορείς να επιλέξεις πολλαπλά συναισθήματα ταυτόχρονα.</p>
                
                <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide pb-6">
                    <div className="flex flex-wrap gap-2">
                        {availableTags.map(tag => (
                            <button
                            key={tag}
                            onClick={() => toggleTag(tag)}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border backdrop-blur-md flex items-center gap-2 ${
                                selectedTags.includes(tag)
                                ? "bg-emerald-500 text-white border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                                : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white"
                            }`}
                            >
                            <span>{tag}</span>
                            {selectedTags.includes(tag) && <span className="text-white">✓</span>}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex gap-3 mt-auto">
                    <button 
                        onClick={clearTags}
                        disabled={selectedTags.length === 0}
                        className="flex-1 py-3 rounded-xl bg-white/5 text-slate-400 font-bold text-xs hover:bg-white/10 hover:text-white transition disabled:opacity-50"
                    >
                        Καθαρισμός
                    </button>
                    <button 
                        onClick={() => setShowAllTagsModal(false)}
                        className="flex-1 py-3 rounded-xl bg-emerald-600/90 text-white font-bold text-xs hover:bg-emerald-500 transition shadow-lg shadow-emerald-500/20 border border-emerald-500/50"
                    >
                        Εφαρμογή
                    </button>
                </div>
            </div>
        </div>
      )}

      {viewingProfileUid && <UserProfileModal userId={viewingProfileUid} onClose={() => setViewingProfileUid(null)} onOpenExperience={onOpenExperience} />}
    </div>
  );
}