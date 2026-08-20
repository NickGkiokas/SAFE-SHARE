import React, { useEffect, useState } from "react";
import { db } from "../firebase-config";
import { collection, query, where, getDocs, getCountFromServer } from "firebase/firestore";
import { useData } from "../context/DataContext"; 
import { useAuth } from "../context/AuthContext";

interface Props {
  userId: string;
  onClose: () => void;
  onOpenExperience?: (exp: any) => void; 
}

const getShortId = (uid: string) => uid ? uid.slice(-4).toUpperCase() : "???";

export default function UserProfileModal({ userId, onClose, onOpenExperience }: Props) {
  const { user } = useAuth(); 
  const shortId = getShortId(userId);
  const [fullStats, setFullStats] = useState<{ posts: number | string, helps: number | string }>({ posts: "-", helps: "-" });
  
  const { experiences } = useData(); 
  const userPosts = experiences.filter(exp => exp.authorUid === userId);

  const displayAvatar = userId === user?.uid 
      ? (user?.photoURL || "👤") 
      : ((userPosts[0] as any)?.authorAvatar || "👤");

  // ✅ Ο ΙΔΙΟΣ ΑΚΡΙΒΩΣ ΑΠΟΛΥΤΟΣ ΥΠΟΛΟΓΙΣΜΟΣ ΜΕ ΤΟ PROFILE
  useEffect(() => {
    if (!userId) return;
    let isMounted = true;
    
    const fetchFullStats = async () => {
        try {
            // 1. Posts
            const postsQ = query(collection(db, "experiences"), where("authorUid", "==", userId));
            const postsCountSnap = await getCountFromServer(postsQ);
            const postsCount = postsCountSnap.data().count;

            // 2. Με Βοήθησες
            const allExpsSnap = await getDocs(collection(db, "experiences"));
            let helpsCount = 0;
            
            allExpsSnap.forEach(docSnap => {
                const data = docSnap.data();
                if (data.comments && Array.isArray(data.comments)) {
                    data.comments.forEach((c: any) => {
                        if (c.authorUid === userId && c.helpfulBy && Array.isArray(c.helpfulBy)) {
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
  }, [userId]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div 
        className="bg-slate-900 w-full max-w-xs rounded-[2rem] border border-slate-700 shadow-2xl relative flex flex-col max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()} 
      >
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-black/40 text-white rounded-full flex items-center justify-center hover:bg-black/60 transition z-50 border border-white/10"
        >
            ✕
        </button>

        <div className="h-28 shrink-0 bg-gradient-to-br from-emerald-900 via-slate-800 to-slate-900 rounded-t-[2rem] relative z-0"></div>

        <div className="px-6 pb-6 -mt-12 flex flex-col items-center relative z-10 shrink-0">
          
          <div className="w-24 h-24 rounded-full bg-slate-950 border-4 border-slate-900 flex items-center justify-center shadow-xl mb-3 text-5xl">
              {displayAvatar}
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">Μέλος #{shortId}</h2>
          <p className="text-xs text-slate-500 mb-6 font-medium tracking-wide">Κοινότητα SafeShare</p>

          <div className="flex w-full justify-center gap-0 border-t border-slate-800/50 pt-6">
            <div className="flex-1 flex flex-col items-center border-r border-slate-800/50">
              <span className="text-2xl font-black text-white">
                {fullStats.posts}
              </span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Δημοσιευσεις</span>
            </div>
            
            <div className="flex-1 flex flex-col items-center">
              <span className="text-2xl font-black text-emerald-400">
                 {fullStats.helps}
              </span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">"Με βοηθησες"</span>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 border-t border-slate-800/50 pt-4">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 text-center">
              Προσφατες Δημοσιευσεις
            </h4>
            
            <div className="space-y-3">
                {userPosts.map(exp => (
                    <div 
                        key={exp.id} 
                        onClick={() => {
                            onClose();
                            if (onOpenExperience) onOpenExperience(exp);
                        }}
                        className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 cursor-pointer active:scale-95 transition"
                    >
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase tracking-wider">
                              {exp.emotion}
                            </span>
                            <span className="text-[9px] text-slate-500">
                              {new Date(exp.createdAt).toLocaleDateString('el-GR')}
                            </span>
                        </div>
                        <h3 className="text-slate-200 text-sm font-medium line-clamp-2 mt-2 leading-tight">
                          {exp.title}
                        </h3>
                    </div>
                ))}
                
                {userPosts.length === 0 && (
                    <p className="text-slate-500 text-xs text-center py-2">
                      Δεν βρέθηκαν τοπικά posts.
                    </p>
                )}
            </div>
        </div>
        
      </div>
    </div>
  );
}