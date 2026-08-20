import React, { useState, useMemo } from "react";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import UserProfileModal from "../components/UserProfileModal";

const getShortId = (uid: string) => uid ? uid.slice(-4).toUpperCase() : "Guest";

export default function SearchScreen({ onOpenExperience }: any) {
  const { experiences, savedPostIds } = useData();
  const { user: currentUser } = useAuth(); // ✅ Μετονομασία σε currentUser για αποφυγή conflict
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserUid, setSelectedUserUid] = useState<string | null>(null);
  
  const [exploreTab, setExploreTab] = useState<"trending" | "foryou">("trending");

  const usersList = useMemo(() => {
    const usersMap = new Map();
    experiences.forEach(exp => {
      if (!usersMap.has(exp.authorUid)) {
        usersMap.set(exp.authorUid, { 
            uid: exp.authorUid, 
            shortId: getShortId(exp.authorUid), 
            avatar: (exp as any).authorAvatar || "👤", // ✅ Αποθήκευση του Avatar
            posts: [exp] 
        });
      } else {
        usersMap.get(exp.authorUid).posts.push(exp);
      }
    });
    return Array.from(usersMap.values());
  }, [experiences]);

  const trendingPosts = useMemo(() => {
    return [...experiences]
        .sort((a, b) => (b.comments?.length || 0) - (a.comments?.length || 0))
        .slice(0, 20); 
  }, [experiences]);

  const forYouPosts = useMemo(() => {
    if (!currentUser || !savedPostIds || savedPostIds.length === 0) return [];

    const savedPosts = experiences.filter(exp => savedPostIds.includes(exp.id));
    const preferredTags = new Set(savedPosts.map(exp => exp.emotion).filter(Boolean));

    if (preferredTags.size === 0) return [];

    return experiences
        .filter(exp => 
            preferredTags.has(exp.emotion) && 
            !savedPostIds.includes(exp.id) && 
            exp.authorUid !== currentUser.uid
        )
        .sort((a, b) => (b.comments?.length || 0) - (a.comments?.length || 0))
        .slice(0, 20);
  }, [experiences, savedPostIds, currentUser]);

  const filteredUsers = usersList.filter(user => user.shortId.includes(searchTerm.toUpperCase()));

  return (
    <div className="h-full w-full overflow-y-auto bg-transparent scrollbar-hide scroll-smooth relative">
      
      <div className="sticky top-0 z-30 glass-header pt-4 px-4 pb-3 shadow-lg">
        <h2 className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 mb-4">
          Εξερεύνηση
        </h2>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <span className="text-slate-500 text-sm">🔍</span>
          </div>
          <input 
            type="text"
            placeholder="Αναζήτηση μέλους με ID (π.χ. A4F2)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            maxLength={4}
            className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-2xl py-3 pl-11 pr-4 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 uppercase placeholder:normal-case shadow-inner transition-all"
          />
        </div>
      </div>

      <div className="p-4 pb-24">
        {searchTerm.length > 0 ? (
          <div className="space-y-3 animate-fade-in">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">Αποτελεσματα Χρηστων</h3>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <div 
                  key={user.uid}
                  onClick={() => setSelectedUserUid(user.uid)}
                  className="glass-card p-4 rounded-2xl flex items-center justify-between cursor-pointer active:scale-95 transition-all shadow-md"
                >
                  <div className="flex items-center gap-4">
                    
                    {/* ✅ Εμφάνιση του EMOJI στην αναζήτηση */}
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl shadow-inner">
                        {user.uid === currentUser?.uid ? (currentUser?.photoURL || "👤") : user.avatar}
                    </div>

                    <div>
                      <h3 className="text-white font-bold text-sm">Μέλος #{user.shortId}</h3>
                      <p className="text-slate-400 text-xs font-medium">{user.posts.length} δημοσιεύσεις</p>
                    </div>
                  </div>
                  <span className="text-slate-500 text-xl font-bold">›</span>
                </div>
              ))
            ) : (
              <div className="text-center py-10 opacity-50 glass-card rounded-2xl">
                 <p className="text-slate-300 text-sm font-bold">Δεν βρέθηκε μέλος με αυτό το ID.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="animate-fade-in">
              
              <div className="flex gap-6 mb-4 px-1">
                  <button 
                    onClick={() => setExploreTab("trending")}
                    className={`text-sm font-bold pb-2 transition-colors ${exploreTab === "trending" ? "text-emerald-400 border-b-2 border-emerald-400" : "text-slate-400 hover:text-slate-200"}`}
                  >
                    Συζητιούνται τώρα...
                  </button>
                  <button 
                    onClick={() => setExploreTab("foryou")}
                    className={`text-sm font-bold pb-2 transition-colors ${exploreTab === "foryou" ? "text-emerald-400 border-b-2 border-emerald-400" : "text-slate-400 hover:text-slate-200"}`}
                  >
                    Για εσένα
                  </button>
              </div>
              
              <div className="grid grid-cols-2 gap-3 px-1">
                  {(exploreTab === "trending" ? trendingPosts : forYouPosts).map((exp, index) => (
                      <div 
                          key={exp.id}
                          onClick={() => onOpenExperience(exp)}
                          className={`glass-card p-4 rounded-[1.5rem] flex flex-col justify-between cursor-pointer active:scale-95 transition-all shadow-md ${
                              index % 5 === 0 ? "col-span-2 aspect-auto" : "aspect-square"
                          }`}
                      >
                          <div>
                              <span className="text-[9px] px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black uppercase tracking-wider mb-3 inline-block">
                                  {exp.emotion}
                              </span>
                              <h4 className="text-white font-bold text-sm leading-tight line-clamp-3 mt-1">
                                  {exp.title}
                              </h4>
                          </div>
                          
                          <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
                              <span className="text-[10px] text-slate-400 font-bold uppercase">#{getShortId(exp.authorUid)}</span>
                              <span className="text-[10px] text-slate-300 font-bold flex items-center gap-1">
                                  💬 {exp.comments?.length || 0}
                              </span>
                          </div>
                      </div>
                  ))}
              </div>

              {exploreTab === "foryou" && forYouPosts.length === 0 && (
                <div className="text-center py-12 px-4 glass-card rounded-[2rem] mt-4 shadow-lg">
                  <span className="text-4xl mb-3 block">✨</span>
                  <h4 className="text-white font-bold mb-2">Ο χώρος σου</h4>
                  <p className="text-slate-400 text-xs font-medium leading-relaxed">
                    Αποθήκευσε μερικές εμπειρίες και θα σου προτείνουμε εδώ παρόμοιες, που μπορεί να σε βοηθήσουν ή να βοηθήσεις κι εσύ!
                  </p>
                </div>
              )}

          </div>
        )}
      </div>

      {selectedUserUid && (
        <UserProfileModal 
          userId={selectedUserUid}
          onClose={() => setSelectedUserUid(null)}
          onOpenExperience={onOpenExperience}
        />
      )}
    </div>
  );
}