import React, { useState, useRef, useEffect } from "react";
import { Experience, AppComment } from "../types"; 
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase-config";
import UserProfileModal from "../components/UserProfileModal"; 

const getShortId = (uid: string) => uid ? uid.slice(-4).toUpperCase() : "Guest";
const formatTag = (text: string) => text ? text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase() : "";

interface Props {
  experience: Experience;
  onBack: () => void;
  highlightCommentId?: string; 
}

export default function ViewExperienceScreen({ experience: initialExperience, onBack, highlightCommentId }: Props) {
  const { user } = useAuth();
  const { addComment, deleteExperience, toggleCommentHelpful, deleteComment } = useData();
  
  const [liveExperience, setLiveExperience] = useState<Experience>(initialExperience);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [showPostDeleteModal, setShowPostDeleteModal] = useState(false);
  const [showPostDeleteSuccess, setShowPostDeleteSuccess] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [showCommentDeleteSuccess, setShowCommentDeleteSuccess] = useState(false);

  const [viewingProfileUid, setViewingProfileUid] = useState<string | null>(null);

  const [replyToUid, setReplyToUid] = useState<string | null>(null);
  const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isDeletingRef = useRef(false);

  const isAdmin = user?.email === "admin@safeshare.com";
  const isAuthor = user?.uid === liveExperience.authorUid;
  const canDeletePost = isAuthor || isAdmin; 

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "experiences", initialExperience.id), (docSnap) => {
        if (docSnap.exists()) {
            setLiveExperience({ 
                ...docSnap.data(), 
                id: docSnap.id, 
                createdAt: docSnap.data().createdAt?.toMillis() || Date.now()
            } as Experience);
        } else {
            if (!isDeletingRef.current) onBack();
        }
    });
    return () => unsub();
  }, [initialExperience.id, onBack]);

  useEffect(() => {
    if (highlightCommentId && liveExperience.comments) {
        const timer = setTimeout(() => {
            const element = document.getElementById(`comment-${highlightCommentId}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 500);
        return () => clearTimeout(timer);
    }
  }, [highlightCommentId, liveExperience.comments]);

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setIsSubmitting(true);
    
    // Πάντα στέλνουμε το ID του αρχικού σχολίου ως parentId για να κρατάμε 2 επίπεδα εσοχής το πολύ
    await addComment(liveExperience.id, commentText, liveExperience.authorUid, replyToUid || undefined, replyToCommentId || undefined);
    
    setCommentText(""); 
    setReplyToUid(null);
    setReplyToCommentId(null);
    setIsSubmitting(false);
  };

  const confirmDeletePost = async () => {
    try {
        isDeletingRef.current = true;
        await deleteExperience(liveExperience.id);
        setShowPostDeleteModal(false);
        setShowPostDeleteSuccess(true);
        setTimeout(() => { onBack(); }, 1500);
    } catch (error) {
        isDeletingRef.current = false;
        setShowPostDeleteModal(false);
    }
  };

  const confirmDeleteComment = async () => {
      if (!commentToDelete) return;
      try {
          if (deleteComment) {
              await deleteComment(liveExperience.id, commentToDelete);
              setCommentToDelete(null);
              setShowCommentDeleteSuccess(true);
              setTimeout(() => setShowCommentDeleteSuccess(false), 1500);
          }
      } catch (error) {
          setCommentToDelete(null);
          alert("Απέτυχε η διαγραφή.");
      }
  };

  const handleReply = (authorUid: string, commentId: string, actualParentId?: string) => {
    setReplyToUid(authorUid);
    // ✅ Αν το σχόλιο στο οποίο απαντάμε είναι ήδη απάντηση, 
    // χρησιμοποιούμε το δικό του parentId για να μείνουν όλα στο ίδιο επίπεδο
    setReplyToCommentId(actualParentId || commentId);
    setCommentText((prev) => `@Μέλος#${getShortId(authorUid)} ` + prev);
    inputRef.current?.focus();
  };

  const allComments = liveExperience.comments || [];
  const rootComments = allComments.filter(c => !c.parentId).sort((a,b) => a.createdAt > b.createdAt ? 1 : -1);

  const CommentItem = ({ comment, isReply = false }: { comment: AppComment, isReply?: boolean }) => {
    const replies = allComments.filter(c => c.parentId === comment.id).sort((a,b) => a.createdAt > b.createdAt ? 1 : -1);
    const isHelpful = comment.helpfulBy?.includes(user?.uid || "");
    const helpfulCount = comment.helpfulBy?.length || 0;
    const canDeleteComment = (user?.uid === comment.authorUid) || isAdmin;
    const isHighlighted = highlightCommentId === comment.id;

    return (
        <div id={`comment-${comment.id}`} className={`flex flex-col ${isReply ? "mt-3" : "mb-5"} transition-all duration-1000 ${isHighlighted ? "bg-emerald-500/20 p-3 rounded-2xl ring-2 ring-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]" : ""}`}>
            <div className={`flex gap-3 group`}>
                
                <div 
                    onClick={() => setViewingProfileUid(comment.authorUid)}
                    className={`rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 mt-1 cursor-pointer shadow-sm hover:scale-105 transition-transform ${isReply ? "w-7 h-7 text-xs" : "w-9 h-9 text-base"}`}
                >
                    {comment.authorUid === user?.uid ? (user?.photoURL || "👤") : ((comment as any).authorAvatar || "👤")}
                </div>
                
                <div className="flex-1 min-w-0 flex flex-col items-end"> 
                    <div className={`w-full p-4 rounded-2xl border shadow-inner ${isReply ? "bg-white/5 border-white/5" : "bg-white/10 border-white/10"}`}>
                        <div className="flex justify-between items-baseline mb-2">
                            <div className="flex items-center gap-2">
                                <span 
                                    onClick={() => setViewingProfileUid(comment.authorUid)}
                                    className="text-[11px] font-extrabold text-emerald-400 cursor-pointer hover:text-emerald-300 transition-colors"
                                >
                                    Μέλος #{getShortId(comment.authorUid)}
                                </span>
                                <span className="text-[9px] text-slate-500 font-bold tracking-wider uppercase">
                                    {comment.createdAt ? new Date(comment.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                                </span>
                            </div>
                        </div>
                        <p className="text-sm text-slate-200 whitespace-pre-wrap break-words font-medium leading-relaxed">{comment.text}</p>
                    </div>
                    
                    <div className="flex items-center justify-between w-full mt-2 px-1">
                        <div className="flex items-center gap-4">
                            <button 
                              onClick={() => handleReply(comment.authorUid, comment.id, comment.parentId)}
                              className="text-[10px] text-slate-400 font-bold hover:text-emerald-400 transition-colors"
                            >
                              ↩ Απάντηση
                            </button>

                            <button 
                              onClick={() => toggleCommentHelpful(liveExperience.id, comment)}
                              className={`text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                                isHelpful 
                                  ? "text-pink-500 drop-shadow-[0_0_8px_rgba(236,72,153,0.5)]" 
                                  : "text-slate-500 hover:text-pink-400"
                              }`}
                            >
                              <span className={`text-sm ${isHelpful ? "scale-110" : ""}`}>{isHelpful ? "❤️" : "🤍"}</span>
                              {helpfulCount > 0 && <span>{helpfulCount}</span>}
                            </button>
                        </div>

                        {canDeleteComment && (
                            <button 
                                onClick={() => setCommentToDelete(comment.id)}
                                className="text-[11px] text-slate-600 hover:text-red-500 flex items-center gap-1 transition-colors px-2 py-1"
                            >
                                🗑️
                            </button>
                        )}
                    </div>
                </div>
            </div>
            
            {replies.length > 0 && (
                <div className="ml-11 border-l border-white/10 pl-4 mt-3">
                    {replies.map(reply => <CommentItem key={reply.id} comment={reply} isReply={true} />)}
                </div>
            )}
        </div>
    );
  };

  const postTags = Array.isArray(liveExperience.emotion) ? liveExperience.emotion : [liveExperience.emotion];

  return (
    <div className="flex flex-col absolute inset-0 z-20 overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-white">
      
      <div className="glass-header pt-4 px-4 pb-3 flex items-center justify-between z-30 shadow-lg shrink-0">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors font-bold text-sm flex items-center gap-1">
                <span>←</span> Πίσω
            </button>
            <div className="flex flex-col">
                <h2 className="text-sm font-extrabold text-slate-200">Συζήτηση</h2>
                <span className="text-[9px] text-slate-500 font-bold tracking-widest uppercase">ID: {liveExperience.id.slice(-6)}</span>
            </div>
        </div>
        {canDeletePost && (
            <button onClick={() => setShowPostDeleteModal(true)} className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 shadow-md ${isAdmin ? "border-red-500 bg-red-600 text-white" : "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"}`}>
                <span>🗑️</span> {isAdmin ? "Admin Delete" : "Διαγραφή"}
            </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-6">
        <div className="glass-card p-6 rounded-[2rem] shadow-xl relative mt-2">
            <div className="flex justify-between items-start mb-4">
                <div className="flex flex-wrap gap-1">
                    {postTags.map((tag, idx) => tag && (
                        <span key={idx} className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {formatTag(tag)} 
                        </span>
                    ))}
                </div>
                <span className="text-[10px] text-slate-500 font-bold tracking-wider uppercase">{new Date(liveExperience.createdAt).toLocaleDateString('el-GR')}</span>
            </div>
            
            <h1 className="text-2xl font-extrabold text-white mb-4 leading-tight">{liveExperience.title}</h1>
            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap font-medium text-sm mb-6">{liveExperience.body}</p>

            <div className="pt-4 border-t border-white/5 flex items-center gap-3">
                <div 
                    onClick={() => setViewingProfileUid(liveExperience.authorUid)} 
                    className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-base shadow-sm cursor-pointer hover:scale-105 transition-transform"
                >
                    {liveExperience.authorUid === user?.uid ? (user?.photoURL || "👤") : ((liveExperience as any).authorAvatar || "👤")}
                </div>
                <span 
                    onClick={() => setViewingProfileUid(liveExperience.authorUid)} 
                    className="text-xs text-slate-400 font-medium cursor-pointer hover:text-emerald-400 transition-colors"
                >
                    Μέλος <span className="font-bold text-slate-200 group-hover:text-emerald-400">#{getShortId(liveExperience.authorUid)}</span>
                </span>
            </div>
        </div>

        <div className="space-y-2 mt-6">
            <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest px-2 mb-6">Σχολια ({liveExperience.comments?.length || 0})</h3>
            {rootComments.length === 0 ? (
                <div className="text-center py-10 glass-card rounded-[2rem] opacity-70">
                    <p className="text-slate-400 font-bold text-sm">Κανένα σχόλιο ακόμα.</p>
                </div>
            ) : (
                rootComments.map(comment => <CommentItem key={comment.id} comment={comment} />)
            )}
        </div>
      </div>

      <form onSubmit={handleSendComment} className="glass-header p-4 border-t border-white/5 w-full z-30 shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <div className="flex gap-3 items-end">
            <div className="flex-1 bg-white/5 border border-white/10 shadow-inner rounded-2xl px-4 py-3 focus-within:ring-1 focus-within:ring-emerald-500/50 transition-all">
              <input 
                  ref={inputRef} 
                  type="text" 
                  value={commentText} 
                  onChange={(e) => setCommentText(e.target.value)} 
                  placeholder={replyToUid ? "Γράψε την απάντησή σου..." : "Γράψε ένα σχόλιο..."} 
                  className="w-full bg-transparent text-sm font-medium text-white focus:outline-none placeholder-slate-500"
              />
            </div>
            <button 
                disabled={!commentText.trim() || isSubmitting} 
                className="bg-emerald-500 text-slate-950 p-3 rounded-2xl font-black disabled:opacity-50 hover:bg-emerald-400 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.4)] flex-shrink-0"
            >
                {isSubmitting ? "..." : "➤"}
            </button>
        </div>
      </form>

      {showPostDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="glass-card border border-white/10 p-6 rounded-[2rem] w-full max-w-sm shadow-2xl">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 text-3xl mb-4 mx-auto shadow-inner">🗑️</div>
                <h3 className="text-xl font-extrabold text-white text-center mb-2">Διαγραφή Δημοσίευσης;</h3>
                <p className="text-slate-400 text-sm font-medium text-center mb-6">Είσαι σίγουρος; Αυτή η ενέργεια είναι οριστική.</p>
                <div className="flex gap-3">
                    <button onClick={() => setShowPostDeleteModal(false)} className="flex-1 py-3 rounded-xl bg-white/10 text-slate-300 font-bold text-sm hover:bg-white/20 transition-colors">Άκυρο</button>
                    <button onClick={confirmDeletePost} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-500 shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all">Διαγραφή</button>
                </div>
            </div>
        </div>
      )}

      {commentToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="glass-card border border-white/10 p-6 rounded-[2rem] w-full max-w-sm shadow-2xl transform scale-100 transition-all">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 text-3xl mb-4 mx-auto shadow-inner">💬</div>
                <h3 className="text-xl font-extrabold text-white text-center mb-2">Διαγραφή Σχολίου;</h3>
                <p className="text-slate-400 text-sm font-medium text-center mb-6">Το σχόλιο θα αφαιρεθεί οριστικά.</p>
                <div className="flex gap-3">
                    <button onClick={() => setCommentToDelete(null)} className="flex-1 py-3 rounded-xl bg-white/10 text-slate-300 font-bold text-sm hover:bg-white/20 transition-colors">Άκυρο</button>
                    <button onClick={confirmDeleteComment} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-500 shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all">Διαγραφή</button>
                </div>
            </div>
        </div>
      )}

      {(showPostDeleteSuccess || showCommentDeleteSuccess) && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in">
            <div className="glass-card border border-white/10 p-8 rounded-[2.5rem] w-full max-w-xs shadow-2xl text-center transform scale-110 transition-all">
                <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 text-4xl mb-4 mx-auto shadow-[0_0_30px_rgba(239,68,68,0.4)] animate-bounce">🗑️</div>
                <h3 className="text-2xl font-extrabold text-white mb-2">Διαγράφηκε</h3>
                <p className="text-slate-400 text-sm font-medium">Το αντικείμενο αφαιρέθηκε.</p>
            </div>
        </div>
      )}

      {viewingProfileUid && (
        <UserProfileModal 
            userId={viewingProfileUid}
            onClose={() => setViewingProfileUid(null)}
        />
      )}
    </div>
  );
}