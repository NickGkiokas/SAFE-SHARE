import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { updateProfile } from "firebase/auth";
import { collection, query, where, getDocs, getCountFromServer } from "firebase/firestore";
import { db } from "../firebase-config";

const getShortId = (uid: string) => uid ? uid.slice(-4).toUpperCase() : "Guest";
const formatTag = (text: string) => text ? text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase() : "";

const AVATAR_OPTIONS = [
  "👤", "🌿", "🌊", "🌙", "☁️", 
  "🦉", "🦊", "🐱", "🦋", "☕",
  "🌻", "⛰️", "🔮", "🎨", "🧩"
];

export default function ProfileScreen({ onBack, onOpenExperience }: any) {
  const { user, logout } = useAuth();
  const { experiences, getSavedExperiences, savedPostIds } = useData();
  
  const [activeTab, setActiveTab] = useState<"my_posts" | "saved">("my_posts");
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccountDetailsOpen, setIsAccountDetailsOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  
  const [selectedAvatar, setSelectedAvatar] = useState(() => {
      return user?.photoURL || localStorage.getItem('userAvatar') || "👤";
  });

  const [fullStats, setFullStats] = useState<{posts: number | string, helps: number | string}>({ posts: "-", helps: "-" });

  useEffect(() => {
      if (user?.photoURL) {
          setSelectedAvatar(user.photoURL);
          localStorage.setItem('userAvatar', user.photoURL);
      }
  }, [user?.photoURL]);

  // ✅ Ο ΑΠΟΛΥΤΟΣ ΥΠΟΛΟΓΙΣΜΟΣ ΑΠΟ ΤΗ ΒΑΣΗ
  useEffect(() => {
      if (!user?.uid) return;
      let isMounted = true;

      const fetchFullStats = async () => {
          try {
              // 1. Posts
              const postsQ = query(collection(db, "experiences"), where("authorUid", "==", user.uid));
              const postsCountSnap = await getCountFromServer(postsQ);
              const postsCount = postsCountSnap.data().count;

              // 2. Με Βοήθησες (Ψάχνει όλα τα likes στα σχόλια)
              const allExpsSnap = await getDocs(collection(db, "experiences"));
              let helpsCount = 0;
              
              allExpsSnap.forEach(docSnap => {
                  const data = docSnap.data();
                  if (data.comments && Array.isArray(data.comments)) {
                      data.comments.forEach((c: any) => {
                          if (c.authorUid === user.uid && c.helpfulBy && Array.isArray(c.helpfulBy)) {
                              helpsCount += c.helpfulBy.length;
                          }
                      });
                  }
              });

              if (isMounted) setFullStats({ posts: postsCount, helps: helpsCount });
          } catch (error) {
              console.error("Σφάλμα στατιστικών:", error);
          }
      };

      fetchFullStats();
      return () => { isMounted = false; };
  }, [user?.uid]);

  const myPosts = experiences.filter(exp => exp.authorUid === user?.uid);

  useEffect(() => {
    if (activeTab === "saved") {
      setIsLoadingSaved(true);
      getSavedExperiences().then(posts => {
        setSavedPosts(posts);
        setIsLoadingSaved(false);
      });
    }
  }, [activeTab, savedPostIds, getSavedExperiences]);

  const handleSelectAvatar = async (avatar: string) => {
      setSelectedAvatar(avatar);
      setIsAvatarModalOpen(false);
      localStorage.setItem('userAvatar', avatar); 

      if (user) {
          try {
              await updateProfile(user, { photoURL: avatar });
          } catch (error) {
              console.error("Σφάλμα:", error);
          }
      }
  };

  const renderPost = (exp: any) => (
    <div key={exp.id} onClick={() => onOpenExperience(exp)} className="glass-card p-5 rounded-[2rem] shadow-md active:scale-[0.98] transition-all cursor-pointer mb-4">
      <div className="flex justify-between items-start mb-3">
        <span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          {formatTag(exp.emotion)} 
        </span>
        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{new Date(exp.createdAt).toLocaleDateString('el-GR')}</span>
      </div>
      <h3 className="text-white font-bold text-lg mb-2 leading-tight line-clamp-2">{exp.title}</h3>
      <p className="text-slate-300 text-sm line-clamp-2 leading-relaxed">{exp.body}</p>
      <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-[10px] text-slate-400">
        <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-sm shadow-sm">
                {exp.authorUid === user?.uid ? (user?.photoURL || selectedAvatar || "👤") : (exp.authorAvatar || "👤")}
            </div>
            <span>Μέλος #{getShortId(exp.authorUid)}</span>
        </div>
        <span className="flex items-center gap-1 font-bold text-slate-300">💬 {exp.comments?.length || 0}</span>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-transparent text-white overflow-hidden relative z-10">
      <div className="shrink-0 glass-header p-5 flex flex-col shadow-lg relative z-20">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold tracking-wide">Μέλος #{getShortId(user?.uid || "")}</h2>
          <button onClick={() => setIsMenuOpen(true)} className="p-2 -mr-2 text-slate-300 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
          </button>
        </div>
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => setIsAvatarModalOpen(true)} className="relative w-20 h-20 shrink-0 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-4xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 transition-all group border-2 border-emerald-300/50">
            {selectedAvatar}
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-slate-800 rounded-full border border-slate-600 flex items-center justify-center shadow-lg group-hover:bg-slate-700 transition-colors"><span className="text-[10px]">✏️</span></div>
          </button>
          <div className="flex flex-1 justify-between items-center ml-5 pr-2 gap-2">
            <div className="text-center flex-1">
                <span className="block text-xl font-black text-white">{fullStats.posts}</span>
                <span className="text-[9px] text-slate-400 uppercase tracking-widest">Εμπειριες</span>
            </div>
            <div className="text-center flex-1">
                <span className="block text-xl font-black text-white">{savedPostIds.length}</span>
                <span className="text-[9px] text-slate-400 uppercase tracking-widest">Αποθηκ.</span>
            </div>
            <div className="text-center flex-1">
                <span className="block text-xl font-black text-emerald-400">{fullStats.helps}</span>
                <span className="text-[9px] text-slate-400 uppercase tracking-widest">Βοηθησες</span>
            </div>
          </div>
        </div>
      </div>

      <div className="shrink-0 flex border-b border-white/10 relative z-20 bg-white/5">
        <button onClick={() => setActiveTab("my_posts")} className={`flex-1 py-4 text-sm font-bold transition ${activeTab === "my_posts" ? "text-emerald-400 border-b-2 border-emerald-400" : "text-slate-400 hover:text-slate-200"}`}>Οι εμπειρίες μου</button>
        <button onClick={() => setActiveTab("saved")} className={`flex-1 py-4 text-sm font-bold transition ${activeTab === "saved" ? "text-emerald-400 border-b-2 border-emerald-400" : "text-slate-400 hover:text-slate-200"}`}>Αποθηκευμένα</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 scroll-smooth pb-24 relative z-10">
        {activeTab === "my_posts" ? (
          myPosts.length > 0 ? myPosts.map(renderPost) : <div className="text-center py-10 opacity-60 text-sm text-slate-300">Δεν έχεις γράψει κάποια εμπειρία ακόμα.</div>
        ) : (
          isLoadingSaved ? <div className="text-center py-10 opacity-60 text-sm text-slate-300 animate-pulse">Φόρτωση αποθηκευμένων...</div> : savedPosts.length > 0 ? savedPosts.map(renderPost) : <div className="text-center py-10 opacity-60 text-sm text-slate-300">Δεν έχεις αποθηκεύσει καμία εμπειρία.</div>
        )}
      </div>

      {isAvatarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" onClick={() => setIsAvatarModalOpen(false)}>
            <div className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 p-6 rounded-[2rem] w-full max-w-sm shadow-2xl relative" onClick={e => e.stopPropagation()}>
                <button onClick={() => setIsAvatarModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white bg-white/5 rounded-full w-8 h-8 flex items-center justify-center transition-colors shadow-inner">✕</button>
                <h3 className="text-xl font-bold text-white mb-2">Επίλεξε Avatar</h3>
                <p className="text-slate-400 text-xs mb-6">Διάλεξε κάτι που σε εκφράζει. Μπορείς να το αλλάξεις όποτε θες.</p>
                <div className="grid grid-cols-5 gap-3">
                    {AVATAR_OPTIONS.map((avatar, index) => (
                        <button key={index} onClick={() => handleSelectAvatar(avatar)} className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl transition-all ${selectedAvatar === avatar ? "bg-emerald-500/20 border-2 border-emerald-400 scale-110 shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "bg-white/5 border border-white/10 hover:bg-white/10 hover:scale-105"}`}>{avatar}</button>
                    ))}
                </div>
            </div>
        </div>
      )}

      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" onClick={() => setIsMenuOpen(false)}>
            <div className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 p-4 rounded-[2rem] w-full max-w-sm shadow-2xl flex flex-col gap-2" onClick={e => e.stopPropagation()}>
                <button onClick={() => { setIsMenuOpen(false); setIsAccountDetailsOpen(true); }} className="w-full text-left p-4 rounded-2xl hover:bg-white/5 transition-colors text-white font-bold flex items-center gap-3"><span className="text-xl">👤</span> Στοιχεία λογαριασμού</button>
                <button onClick={() => { setIsMenuOpen(false); logout(); }} className="w-full text-left p-4 rounded-2xl hover:bg-red-500/10 text-red-400 transition-colors font-bold flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" /></svg>
                    Αποσύνδεση
                </button>
                <button onClick={() => setIsMenuOpen(false)} className="w-full text-center p-3 mt-2 rounded-2xl text-slate-500 text-sm font-bold hover:text-slate-300 transition-colors">Ακύρωση</button>
            </div>
        </div>
      )}

      {isAccountDetailsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 p-6 rounded-[2rem] w-full max-w-sm shadow-2xl relative">
                <button onClick={() => setIsAccountDetailsOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white bg-white/5 rounded-full w-8 h-8 flex items-center justify-center transition-colors shadow-inner">✕</button>
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><span className="text-2xl">👤</span> Ο Λογαριασμός μου</h3>
                <div className="space-y-5 mb-8">
                    <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1.5 pl-1">Email συνδεσης</p>
                        <div className="bg-black/20 p-4 rounded-2xl border border-white/5 shadow-inner"><p className="text-white font-medium text-sm">{user?.email}</p></div>
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1.5 pl-1">Πληρες ID Λογαριασμου (Hash)</p>
                        <div className="bg-black/20 p-4 rounded-2xl border border-white/5 shadow-inner"><p className="text-emerald-400 font-mono text-xs break-all leading-relaxed select-all">{user?.uid}</p></div>
                    </div>
                </div>
                <div className="flex items-center justify-center gap-2 bg-emerald-500/10 text-emerald-400 p-4 rounded-2xl border border-emerald-500/20 text-xs font-bold tracking-wide w-full shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                    <span className="text-lg drop-shadow-md">🛡️</span> Ο λογαριασμός σου είναι ασφαλής
                </div>
            </div>
        </div>
      )}
    </div>
  );
}