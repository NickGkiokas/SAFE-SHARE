import React, { useState, useMemo } from "react";
import { useData } from "../context/DataContext";
import { SCREENS } from "../types";
import { useAuth } from "../context/AuthContext";

const formatTag = (text: string) => {
  if (!text) return "";
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
};

const BASIC_TAGS = ["Άγχος", "Θλίψη", "Μοναξιά"];
const EXTRA_TAGS = ["Θυμός", "Ντροπή", "Φόβος", "Απογοήτευση"];

export default function CreateExperienceScreen({ onNavigate }: any) {
  const { addExperience, experiences } = useData();
  const { user } = useAuth(); 

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  
  // ✅ ΝΕΟ: Πίνακας για πολλαπλά συναισθήματα/tags
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>(["Άγχος"]); 

  const [isTagsExpanded, setIsTagsExpanded] = useState(false);
  const [showCustomTagModal, setShowCustomTagModal] = useState(false);
  const [customTagInput, setCustomTagInput] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const trendingTags = useMemo(() => {
    const counts: { [key: string]: number } = {};
    const predefined = [...BASIC_TAGS, ...EXTRA_TAGS].map(t => formatTag(t));

    if (experiences) {
        experiences.forEach(exp => {
        if (exp.emotion) {
            // Αν είναι πίνακας τον σαρώνουμε (ανάλογα το schema), αλλιώς σαν string
            const tagsArray = Array.isArray(exp.emotion) ? exp.emotion : [exp.emotion];
            
            tagsArray.forEach((tagStr: string) => {
                const tag = formatTag(tagStr);
                if (!predefined.includes(tag) && tag.length > 2) {
                    counts[tag] = (counts[tag] || 0) + 1;
                }
            });
        }
        });
    }

    return Object.entries(counts)
      .filter(([_, count]) => count >= 1) 
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([tag]) => tag);
  }, [experiences]);

  const handleInitialClick = () => {
    // Ελέγχουμε να υπάρχει κείμενο ΚΑΙ τουλάχιστον 1 tag
    if (!body.trim() || selectedEmotions.length === 0) return;
    setShowConfirmModal(true);
  };

  const handleConfirmUpload = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);

    let finalTitle = title.trim();
    if (!finalTitle) {
        const words = body.trim().split(/\s+/);
        finalTitle = words.slice(0, 6).join(" ");
        if (words.length > 6) finalTitle += "...";
    }

    try {
      await addExperience({
        title: finalTitle,
        excerpt: body.substring(0, 60) + (body.length > 60 ? "..." : ""), 
        body,
        // Σώζουμε τα tags ως array για να μπορεί να ψάξει το HomeScreen πολλαπλά
        emotion: selectedEmotions.map(formatTag) as any, 
        authorUid: user?.uid, 
        topic: "Γενικά",
        createdAt: Date.now(),
        matches: 0,
        comments: []
      });
      
      setIsSubmitting(false);
      setShowSuccessModal(true);

      setTimeout(() => {
        onNavigate(SCREENS.HOME);
      }, 1500);

    } catch (error) {
      console.error(error);
      alert("Κάτι πήγε στραβά. Δοκίμασε ξανά.");
      setIsSubmitting(false);
    }
  };

  // ✅ Προσθήκη/Αφαίρεση Tags
  const toggleEmotion = (tag: string) => {
      setSelectedEmotions(prev => 
          prev.includes(tag) 
          ? prev.filter(t => t !== tag) 
          : [...prev, tag]
      );
  };

  const handleAddCustomTag = () => {
    if (customTagInput.trim()) {
      const newTag = formatTag(customTagInput);
      if (!selectedEmotions.includes(newTag)) {
          setSelectedEmotions([...selectedEmotions, newTag]);
      }
      setShowCustomTagModal(false);
      setCustomTagInput("");
    }
  };

  const handleCancelCustomTag = () => {
    setShowCustomTagModal(false);
    setCustomTagInput(""); 
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-950 via-slate-900/90 to-emerald-950/20 absolute inset-0 z-20 overflow-hidden">
        
        <div className="p-4 border-b border-white/5 bg-white/5 backdrop-blur-xl flex items-center gap-4 sticky top-0 z-10 shadow-sm">
            <button onClick={() => onNavigate(SCREENS.HOME)} className="p-2 -ml-2 text-slate-400 hover:text-white transition font-medium text-sm">
            ✕ Ακύρωση
            </button>
            <h2 className="text-sm font-bold text-white tracking-wide">Νέα Δημοσίευση</h2>
        </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-6">
        
        <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Πως νιωθεις;</label>
            
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-5 transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
              <div className="flex flex-wrap gap-2 items-center">
                {BASIC_TAGS.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleEmotion(tag)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border backdrop-blur-md ${
                      selectedEmotions.includes(tag)
                        ? "bg-emerald-500 text-white border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-105"
                        : "bg-white/5 text-slate-400 border-white/10 hover:border-white/20 hover:text-slate-200 hover:bg-white/10"
                    }`}
                  >
                    {tag}
                  </button>
                ))}

                <button
                  onClick={() => setIsTagsExpanded(!isTagsExpanded)}
                  className={`w-9 h-9 rounded-xl bg-black/20 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all transform shadow-inner ${isTagsExpanded ? "rotate-180 bg-black/40" : ""}`}
                >
                  ▼
                </button>
              </div>

              {isTagsExpanded && (
                <div className="mt-5 animate-fade-in space-y-5">
                  
                  <div className="pt-4 border-t border-white/5">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-3">Περισσοτερα</p>
                    <div className="flex flex-wrap gap-2">
                      {EXTRA_TAGS.map(tag => (
                        <button
                          key={tag}
                          onClick={() => toggleEmotion(tag)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border backdrop-blur-md ${
                            selectedEmotions.includes(tag)
                              ? "bg-emerald-500 text-white border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-105"
                              : "bg-white/5 text-slate-400 border-white/10 hover:border-white/20 hover:text-slate-200 hover:bg-white/10"
                          }`}
                        >
                          {tag}
                        </button>
                      ))}

                      <button
                        onClick={() => setShowCustomTagModal(true)}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 border-dashed hover:bg-emerald-500/20 transition-all flex items-center gap-1 backdrop-blur-sm"
                      >
                        + Άλλο
                      </button>
                    </div>
                  </div>

                  {trendingTags.length > 0 && (
                    <div className="pt-4 border-t border-white/5">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-3">Αλλοι χρηστες ενιωσαν...</p>
                        <div className="flex flex-wrap gap-2">
                        {trendingTags.map(tag => (
                            <button
                            key={tag}
                            onClick={() => toggleEmotion(tag)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border backdrop-blur-md ${
                                selectedEmotions.includes(tag)
                                ? "bg-emerald-500 text-white border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-105"
                                : "bg-black/20 text-slate-400 border-white/5 border-dashed hover:border-white/20 hover:bg-white/10 hover:text-slate-200"
                            }`}
                            >
                            {tag}
                            </button>
                        ))}
                        </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* ✅ Τα επιλεγμένα Chips στο κάτω μέρος του κουτιού */}
            {selectedEmotions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4 pt-2 px-1 animate-fade-in">
                    {selectedEmotions.map(tag => (
                        <div key={tag} className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 pl-3 pr-1 py-1.5 rounded-xl text-[10px] font-bold tracking-widest uppercase shadow-sm backdrop-blur-sm">
                            <span>{formatTag(tag)}</span>
                            <button 
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleEmotion(tag); }} 
                                className="text-emerald-500 hover:text-white hover:bg-emerald-500/40 rounded-lg w-5 h-5 flex items-center justify-center transition-all ml-1"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>

        <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
                Τιτλος <span className="text-[10px] opacity-50 lowercase font-normal">(προαιρετικό)</span>
            </label>
            <input 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-all font-bold shadow-inner backdrop-blur-sm"
                placeholder="Δώσε έναν τίτλο..."
            />
        </div>

        <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Οι σκεψεις σου</label>
            <textarea 
                className="w-full h-40 bg-black/20 border border-white/10 rounded-2xl p-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 outline-none resize-none transition-all min-h-[150px] shadow-inner backdrop-blur-sm leading-relaxed"
                placeholder="Τι σε απασχολεί;"
                value={body}
                onChange={e => setBody(e.target.value)}
                disabled={isSubmitting}
            />
        </div>
      
        <button 
            onClick={handleInitialClick} 
            disabled={!body.trim() || selectedEmotions.length === 0 || isSubmitting}
            className={`w-full py-4 rounded-2xl font-bold transition-all backdrop-blur-md text-base ${
                !body.trim() || selectedEmotions.length === 0 || isSubmitting 
                ? "bg-white/5 text-slate-500 cursor-not-allowed border border-white/5" 
                : "bg-emerald-600/90 text-white hover:bg-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)] border border-emerald-400/50 hover:scale-[1.02] active:scale-[0.98]"
            }`}
        >
            {isSubmitting ? "Δημοσίευση..." : "Μοιράσου το"}
        </button>
      </div>

      {showCustomTagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-lg animate-fade-in">
          <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/10 p-8 rounded-[2rem] w-full max-w-sm shadow-2xl relative">
            <h3 className="text-xl font-bold text-white mb-2">Πως νιώθεις ακριβώς;</h3>
            <p className="text-slate-400 text-sm mb-6">Πρόσθεσε ένα δικό σου tag.</p>
            
            <input 
              autoFocus
              value={customTagInput}
              onChange={(e) => setCustomTagInput(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white mb-6 focus:border-emerald-500/50 outline-none uppercase font-mono text-sm shadow-inner"
              placeholder="ΓΡΑΨΕ ΕΔΩ..."
            />

            <div className="flex gap-3">
              <button 
                onClick={handleCancelCustomTag}
                className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 text-slate-300 font-bold text-sm hover:bg-white/10 transition backdrop-blur-sm"
              >
                Ακύρωση
              </button>
              <button 
                onClick={handleAddCustomTag}
                disabled={!customTagInput.trim()}
                className="flex-1 py-4 rounded-2xl bg-emerald-600/90 backdrop-blur-md border border-emerald-500/50 text-white font-bold text-sm hover:bg-emerald-500 transition shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:shadow-none"
              >
                Προσθήκη
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-lg animate-fade-in">
            <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/10 p-8 rounded-[2.5rem] w-full max-w-xs shadow-2xl transform scale-100 transition-all text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-3xl mb-5 mx-auto border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                    ❔
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Είσαι έτοιμος;</h3>
                <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                    Η εμπειρία σου θα δημοσιευτεί ανώνυμα στην κοινότητα.
                </p>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setShowConfirmModal(false)}
                        className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 text-slate-300 font-bold text-sm hover:bg-white/10 transition backdrop-blur-sm"
                    >
                        Επεξεργασία
                    </button>
                    <button 
                        onClick={handleConfirmUpload}
                        className="flex-1 py-4 rounded-2xl bg-emerald-600/90 backdrop-blur-md border border-emerald-500/50 text-white font-bold text-sm hover:bg-emerald-500 transition shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                    >
                        Δημοσίευση
                    </button>
                </div>
            </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-fade-in">
            <div className="bg-slate-900/80 backdrop-blur-2xl border border-emerald-500/30 p-10 rounded-[3rem] w-full max-w-xs shadow-[0_0_50px_rgba(16,185,129,0.2)] text-center transform scale-110 transition-all">
                <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center text-white text-4xl mb-6 mx-auto shadow-[0_0_30px_rgba(16,185,129,0.5)] animate-bounce border border-emerald-400">
                    ✓
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Ανέβηκε!</h3>
                <p className="text-emerald-400 text-sm font-medium">
                    Η εμπειρία σου ακούστηκε.
                </p>
                <p className="text-slate-500 text-xs mt-6 uppercase tracking-widest font-bold">
                    Μεταβαση στη ροη...
                </p>
            </div>
        </div>
      )}

    </div>
  );
}