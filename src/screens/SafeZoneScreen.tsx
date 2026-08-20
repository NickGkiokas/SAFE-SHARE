import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase-config";
import { doc, getDoc, setDoc } from "firebase/firestore";

import { 
  Calendar, Target, ShieldAlert, Archive, Wind, Headphones, 
  Brain, Gamepad2, Phone, Inbox, Flame, Sprout, Leaf, 
  Flower2, TreePine, TreeDeciduous, Sun, CloudSun, Cloud, 
  CloudRain, CloudLightning, Trash2, List, Plus, RefreshCw, 
  Play, Pause, Eye, Hand, Ear, Droplets, Trophy, Zap, 
  MousePointerClick, Brush, Check, X, ChevronLeft, Smile,
  Pencil, RotateCcw, CheckCircle2, Gift, Lock
} from "lucide-react";

interface WorryItem {
  id: string;
  text: string;
  date: string;
  solved: boolean;
}

interface MoodEntry {
  date: string;
  mood: string;
  note: string;
}

const popSoundUrl = "/pop.mp3"; 

// --- FIREBASE HELPER FUNCTIONS ---
const getHighScore = async (userId: string | undefined, game: string) => {
  if (!userId) return 0;
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    return userDoc.data()?.highScores?.[game] || 0;
  } catch {
    return 0;
  }
};

const saveHighScore = async (userId: string | undefined, game: string, score: number) => {
  if (!userId) return false;
  const userRef = doc(db, "users", userId);
  try {
    const userDoc = await getDoc(userRef);
    const existingScores = userDoc.data()?.highScores || {};
    const oldScore = existingScores[game] || 0;
    
    if (score > oldScore) {
      await setDoc(userRef, { highScores: { ...existingScores, [game]: score } }, { merge: true });
      return true; 
    }
  } catch (err) {
    console.error("Σφάλμα αποθήκευσης σκορ:", err);
  }
  return false;
};

const getUserXP = async (userId: string | undefined) => {
  if (!userId) return 0;
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    return userDoc.data()?.plantXP || 0;
  } catch {
    return 0;
  }
};

const saveUserXP = async (userId: string | undefined, xp: number) => {
  if (!userId) return;
  try {
    await setDoc(doc(db, "users", userId), { plantXP: xp }, { merge: true });
  } catch (err) {
    console.error("Σφάλμα αποθήκευσης XP:", err);
  }
};

const getUserMoods = async (userId: string | undefined) => {
  if (!userId) return [];
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    return userDoc.data()?.moodEntries || [];
  } catch {
    return [];
  }
};

const saveUserMoods = async (userId: string | undefined, entries: MoodEntry[]) => {
  if (!userId) return;
  try {
    await setDoc(doc(db, "users", userId), { moodEntries: entries }, { merge: true });
  } catch (err) {
    console.error("Σφάλμα αποθήκευσης moods:", err);
  }
};

// --- THEMES ---
const THEMES = {
  forest: "from-slate-950 via-slate-900/90 to-emerald-950/20",
  sunset: "from-slate-950 via-indigo-950/90 to-orange-900/20",
  ocean:  "from-slate-950 via-blue-950/90 to-cyan-900/30"
};

export default function SafeZoneScreen() {
  const { user } = useAuth(); 
  const [currentView, setCurrentView] = useState<'menu' | 'relax' | 'games' | 'sounds' | 'worryMenu' | 'worry' | 'burner' | 'sos' | 'jar' | 'plan' | 'mood' | 'focus' | 'rewards'>('menu');
  const [activeGame, setActiveGame] = useState<'popit' | 'tap' | 'zen' | null>(null);
  const [activeRelax, setActiveRelax] = useState<'breathe' | 'grounding' | null>(null);
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  const [theme, setTheme] = useState<'forest' | 'sunset' | 'ocean'>(() => {
      return (localStorage.getItem('safeZoneTheme') as any) || 'forest';
  });

  const [plantXP, setPlantXP] = useState(0);

  // Διόρθωση Scroll: Χρησιμοποιούμε setTimeout για να προλάβει να κάνει render η νέα οθόνη
  useEffect(() => {
      const timeoutId = setTimeout(() => {
          if (scrollRef.current) {
              scrollRef.current.scrollTop = 0;
          }
      }, 50);
      return () => clearTimeout(timeoutId);
  }, [currentView, activeGame, activeRelax]);

  useEffect(() => {
      localStorage.setItem('safeZoneTheme', theme);
  }, [theme]);

  useEffect(() => {
      if (user?.uid) {
          getUserXP(user.uid).then(setPlantXP);
      }
  }, [user?.uid]);

  const triggerGrowth = (amount: number = 10) => {
      setPlantXP(prev => {
          const newXP = prev + amount;
          if (Math.floor(newXP / 50) > Math.floor(prev / 50)) {
              if (navigator.vibrate) navigator.vibrate([50, 100, 50]);
          }
          if (user?.uid) {
              saveUserXP(user.uid, newXP); 
          }
          return newXP;
      });
  };

  const spendXP = (amount: number) => {
      setPlantXP(prev => {
          const newXP = prev - amount;
          if (user?.uid) {
              saveUserXP(user.uid, newXP); 
          }
          return newXP;
      });
  };

  const getPlantStage = (xp: number) => {
      if (xp < 50) return { icon: <Leaf className="w-6 h-6 text-emerald-300" />, name: "Σποράκι", next: 50 };
      if (xp < 150) return { icon: <Sprout className="w-7 h-7 text-emerald-400" />, name: "Βλαστάρι", next: 150 };
      if (xp < 300) return { icon: <Flower2 className="w-8 h-8 text-emerald-400" />, name: "Λουλούδι", next: 300 };
      if (xp < 600) return { icon: <TreePine className="w-8 h-8 text-emerald-500" />, name: "Δεντράκι", next: 600 };
      return { icon: <TreeDeciduous className="w-9 h-9 text-emerald-500" />, name: "Δέντρο", next: xp };
  };

  const handleBack = () => {
    setActiveGame(null);
    setActiveRelax(null);
    setIsGameModalOpen(false);
    if (currentView === 'worry' || currentView === 'burner') setCurrentView('worryMenu');
    else setCurrentView('menu');
  };

  const plantStage = getPlantStage(plantXP);
  const progressPercent = plantStage.next === plantXP ? 100 : ((plantXP % 50) / 50) * 100;

  return (
    <div className={`flex flex-col h-full bg-gradient-to-br ${THEMES[theme]} absolute inset-0 z-20 overflow-hidden transition-colors duration-1000`}>
      
      {/* HEADER */}
      <div className="p-4 border-b border-white/5 bg-white/5 backdrop-blur-xl flex items-center justify-between shrink-0 relative z-30">
        <div className="flex items-center gap-3">
            {currentView !== 'menu' && (
            <button onClick={handleBack} className="p-2 -ml-2 text-slate-400 hover:text-white transition flex items-center">
                <ChevronLeft className="w-5 h-5 mr-1" /> Πίσω
            </button>
            )}
            <div>
            <h2 className="text-lg font-bold tracking-tight text-white">
                Safe<span className={theme === 'sunset' ? 'text-orange-400' : theme === 'ocean' ? 'text-cyan-400' : 'text-emerald-400'}>Zone</span>
            </h2>
            <p className="text-[10px] text-slate-400">
                {currentView === 'menu' && "Ο δικός σου, προσωπικός χώρος."}
                {currentView === 'relax' && "Βρες την ηρεμία σου"}
                {currentView === 'games' && "Διασκέδασε και εκτονώσου"}
                {currentView === 'sounds' && "Άκου, αφέσου και χαλάρωσε"}
                {currentView === 'worryMenu' && "Διαχείριση Σκέψεων"}
                {currentView === 'worry' && "Δες καθαρά τις σκέψεις"}
                {currentView === 'burner' && "Άφησέ το να φύγει"}
                {currentView === 'jar' && "Θυμήσου τα καλά"}
                {currentView === 'plan' && "Το πρωτόκολλο ηρεμίας σου"}
                {currentView === 'mood' && "Ημερολόγιο Διάθεσης"}
                {currentView === 'rewards' && "Το αξίζεις"}
                {currentView === 'focus' && "Απαλή Εστίαση"}
                {currentView === 'sos' && "Άμεση βοήθεια"}
            </p>
            </div>
        </div>

        {currentView === 'menu' && (
            <div className="flex gap-2">
                <button onClick={() => setTheme('forest')} className={`w-5 h-5 rounded-full bg-emerald-500 transition-transform ${theme === 'forest' ? 'scale-125 ring-2 ring-emerald-300 ring-offset-2 ring-offset-slate-900' : 'opacity-50'}`} />
                <button onClick={() => setTheme('sunset')} className={`w-5 h-5 rounded-full bg-orange-500 transition-transform ${theme === 'sunset' ? 'scale-125 ring-2 ring-orange-300 ring-offset-2 ring-offset-slate-900' : 'opacity-50'}`} />
                <button onClick={() => setTheme('ocean')} className={`w-5 h-5 rounded-full bg-cyan-500 transition-transform ${theme === 'ocean' ? 'scale-125 ring-2 ring-cyan-300 ring-offset-2 ring-offset-slate-900' : 'opacity-50'}`} />
            </div>
        )}
      </div>

      {/* ΚΕΝΤΡΙΚΟ CONTAINER ΜΕ SCROLL REF */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden p-4 relative flex flex-col scrollbar-hide pb-28">
        
        {/* 1. MENU */}
        {currentView === 'menu' && (
          <div className="space-y-6 mt-1 animate-fade-in pb-4">
            
            {/* Widget Φυτού */}
            <div className="w-full bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-3xl flex items-center gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400/20 to-emerald-600/20 flex items-center justify-center shadow-inner border border-emerald-500/30">
                    {plantStage.icon}
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-end mb-1">
                        <h3 className="font-bold text-emerald-400 text-sm">Το Φυτό σου: {plantStage.name}</h3>
                        <span className="text-[10px] text-slate-400 font-mono">{plantXP} XP</span>
                    </div>
                    {plantStage.next > plantXP ? (
                        <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                            <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                        </div>
                    ) : (
                        <p className="text-[10px] text-emerald-300 flex items-center gap-1"><Check className="w-3 h-3" /> Έχει αναπτυχθεί πλήρως!</p>
                    )}
                    <p className="text-[9px] text-slate-400 mt-1">Φρόντισε τον εαυτό σου για να μεγαλώσει.</p>
                </div>
            </div>

            <MenuButton 
                icon={<Gift className="w-6 h-6 text-amber-400" />} 
                color="amber" 
                title="Οι Ανταμοιβές Μου" 
                desc="Εξαργύρωσε τους πόντους φροντίδας." 
                onClick={() => setCurrentView('rewards')} 
            />

            {/* ΖΩΝΗ 1: Καθημερινή Φροντίδα */}
            <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-2 flex items-center gap-2">
                    <Sun className="w-4 h-4 text-rose-400" /> Καθημερινη Φροντιδα
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    <GridMenuButton icon={<Calendar className="w-6 h-6 text-rose-400" />} color="rose" title="Ημερολόγιο" onClick={() => setCurrentView('mood')} />
                    <GridMenuButton icon={<Archive className="w-6 h-6 text-amber-400" />} color="amber" title="Βάζο Θετικών" onClick={() => setCurrentView('jar')} />
                    <GridMenuButton icon={<Target className="w-6 h-6 text-indigo-400" />} color="indigo" title="Απαλή Εστίαση" onClick={() => setCurrentView('focus')} />
                    <GridMenuButton icon={<Brain className="w-6 h-6 text-slate-300" />} color="slate" title="Σκέψεις" onClick={() => setCurrentView('worryMenu')} />
                </div>
            </div>

            {/* ΖΩΝΗ 2: Ηρεμία & Εκτόνωση */}
            <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-2 flex items-center gap-2">
                    <Wind className="w-4 h-4 text-emerald-400" /> Ηρεμια & Εκτονωση
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    <GridMenuButton icon={<Leaf className="w-6 h-6 text-emerald-400" />} color="emerald" title="Χαλάρωση" onClick={() => setCurrentView('relax')} />
                    <GridMenuButton icon={<Headphones className="w-6 h-6 text-cyan-400" />} color="cyan" title="Ηχοτοπία" onClick={() => setCurrentView('sounds')} />
                    <div className="col-span-2">
                        <MenuButton icon={<Gamepad2 className="w-6 h-6 text-purple-400" />} color="purple" title="Mini Παιχνίδια" desc="Εύκολα παιχνίδια για απασχόληση & εκτόνωση." onClick={() => setCurrentView('games')} />
                    </div>
                </div>
            </div>

            {/* ΖΩΝΗ 3: Άμεση Βοήθεια */}
            <div>
                <h3 className="text-xs font-bold text-rose-400 uppercase tracking-widest mb-3 px-2 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-400" /> Αμεση Βοηθεια
                </h3>
                <div className="space-y-3">
                    <MenuButton icon={<List className="w-6 h-6 text-blue-400" />} color="blue" title="Το Πλάνο Μου" desc="Τα προσωπικά σου βήματα για την ώρα της κρίσης." onClick={() => setCurrentView('plan')} />
                    <MenuButton icon={<Phone className="w-6 h-6 text-red-400" />} color="red" title="Έκτακτη Ανάγκη" desc="Γραμμές Υποστήριξης & Άμεση Επικοινωνία." onClick={() => setCurrentView('sos')} />
                </div>
            </div>

          </div>
        )}

        {/* --- ΥΠΟ-ΜΕΝΟΥ ΚΑΙ ΟΘΟΝΕΣ --- */}
        {currentView === 'worryMenu' && (
            <div className="space-y-4 animate-fade-in w-full max-w-sm mx-auto mt-4">
                <SubMenuButton icon={<Inbox className="w-6 h-6 text-slate-300" />} color="slate" title="Το Κουτί Ανησυχιών" desc="Αποθήκευσε και αντιμετώπισε προβλήματα." onClick={() => setCurrentView('worry')} />
                <SubMenuButton icon={<Flame className="w-6 h-6 text-orange-400" />} color="orange" title="Σελίδα Εκτόνωσης" desc="Γράψε τον θυμό σου και κάψε τον." onClick={() => setCurrentView('burner')} />
            </div>
        )}

        {currentView === 'burner' && <BurnerNote onBurn={() => triggerGrowth(15)} />}
        {currentView === 'rewards' && <RewardsScreen points={plantXP} onRedeem={spendXP} />}
        {currentView === 'mood' && <MoodTracker userId={user?.uid} onLog={() => triggerGrowth(10)} />}
        {currentView === 'focus' && <FocusTimer onComplete={() => triggerGrowth(20)} />}
        {currentView === 'jar' && <GratitudeJar onAdd={() => triggerGrowth(10)} />}
        {currentView === 'plan' && <SOSProtocol onUse={() => triggerGrowth(5)} />}
        {currentView === 'worry' && <WorryBox onAdd={() => triggerGrowth(5)} />}
        {currentView === 'sounds' && <Soundscapes />}
        {currentView === 'sos' && <Helplines />}

        {/* RELAX */}
        {currentView === 'relax' && (
          <div className="flex flex-col flex-1 min-h-[500px]">
            {!activeRelax ? (
              <div className="space-y-4 animate-fade-in w-full max-w-sm mx-auto mt-4">
                <SubMenuButton icon={<Wind className="w-6 h-6 text-emerald-400" />} color="emerald" title="Ασκήσεις Αναπνοής" desc="Τεχνική 4-7-8 για άμεση ηρεμία." onClick={() => setActiveRelax('breathe')} />
                <SubMenuButton icon={<Droplets className="w-6 h-6 text-orange-400" />} color="orange" title="Τεχνική Γείωσης" desc="Μέθοδος 5-4-3-2-1." onClick={() => setActiveRelax('grounding')} />
              </div>
            ) : (
              <div className="flex-1 flex flex-col relative pt-12">
                <div className="flex-1 flex items-center justify-center">
                  {activeRelax === 'breathe' && <BreathingExercise />}
                  {activeRelax === 'grounding' && <GroundingExercise onComplete={() => triggerGrowth(15)} />}
                </div>
              </div>
            )}
          </div>
        )}

        {/* GAMES */}
        {currentView === 'games' && (
          <div className="flex flex-col flex-1 min-h-[500px]">
            {!activeGame ? (
              <div className="space-y-4 animate-fade-in w-full max-w-sm mx-auto mt-4">
                <SubMenuButton icon={<MousePointerClick className="w-6 h-6 text-purple-400" />} color="purple" title="Pop-it" desc="Σκάσε τις φούσκες!" onClick={() => setActiveGame('popit')} />
                <SubMenuButton icon={<Zap className="w-6 h-6 text-blue-400" />} color="blue" title="Speed Tap" desc="Πόσο γρήγορος είσαι;" onClick={() => setActiveGame('tap')} />
                <SubMenuButton icon={<Brush className="w-6 h-6 text-stone-400" />} color="stone" title="Zen Garden" desc="Ζωγράφισε στην άμμο." onClick={() => setActiveGame('zen')} />
              </div>
            ) : (
              <div className="flex-1 flex flex-col relative pt-12">
                <div className="flex-1 flex items-center justify-center relative z-10">
                  {activeGame === 'popit' && <PopItGame userId={user?.uid} onModalStateChange={setIsGameModalOpen} onGameOver={() => triggerGrowth(5)} />}
                  {activeGame === 'tap' && <SpeedTapGame userId={user?.uid} onModalStateChange={setIsGameModalOpen} onGameOver={() => triggerGrowth(5)} />}
                  {activeGame === 'zen' && <ZenGardenGame onDraw={() => triggerGrowth(2)} />}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// --- SHARED COMPONENTS ---
function MenuButton({ icon, color, title, desc, onClick }: any) {
  return (
    <button onClick={onClick} className="w-full bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-3xl flex items-center gap-4 hover:bg-white/10 transition active:scale-95 group shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
      <div className={`w-12 h-12 rounded-2xl bg-${color}-500/20 flex items-center justify-center group-hover:scale-110 transition shadow-inner border border-${color}-500/20 shrink-0`}>{icon}</div>
      <div className="text-left"><h3 className="font-bold text-white text-sm">{title}</h3><p className="text-slate-400 text-[11px] mt-0.5">{desc}</p></div>
    </button>
  );
}

function GridMenuButton({ icon, color, title, onClick }: any) {
  return (
    <button onClick={onClick} className="w-full h-full bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-3xl flex flex-col items-center justify-center gap-3 hover:bg-white/10 transition active:scale-95 group shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
      <div className={`w-12 h-12 rounded-2xl bg-${color}-500/20 flex items-center justify-center group-hover:scale-110 transition shadow-inner border border-${color}-500/20`}>{icon}</div>
      <h3 className="font-bold text-white text-xs text-center leading-tight">{title}</h3>
    </button>
  );
}

function SubMenuButton({ icon, color, title, desc, onClick }: any) {
  return (
    <button onClick={onClick} className="w-full bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-3xl flex items-center gap-4 hover:bg-white/10 transition active:scale-95 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
      <div className={`w-12 h-12 rounded-2xl bg-${color}-500/20 flex items-center justify-center border border-${color}-500/20`}>{icon}</div>
      <div className="text-left"><h3 className="font-bold text-white text-base">{title}</h3><p className="text-slate-400 text-xs">{desc}</p></div>
    </button>
  );
}

function BackButton({ label, onClick }: any) {
  return (
    <button onClick={onClick} className="absolute top-2 left-0 z-50 text-slate-400 text-xs flex items-center gap-1 hover:text-white px-3 py-2 rounded-xl bg-white/5 backdrop-blur-sm border border-white/5 hover:bg-white/10 transition">
      <ChevronLeft className="w-4 h-4" /> {label}
    </button>
  );
}

// ==========================================
// COMPONENTS
// ==========================================

function BurnerNote({ onBurn }: { onBurn: () => void }) {
    const [text, setText] = useState("");
    const [isBurning, setIsBurning] = useState(false);

    const handleBurn = () => {
        if (!text.trim()) return;
        setIsBurning(true);
        if (navigator.vibrate) navigator.vibrate([100, 50, 100, 200]);
        
        setTimeout(() => {
            setText("");
            setIsBurning(false);
            onBurn();
        }, 2000);
    };

    return (
        <div className="flex flex-col items-center w-full max-w-sm mx-auto animate-fade-in gap-6 pt-4 pb-6">
            <div className="text-center px-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-4 border border-orange-500/30">
                    <Flame className="w-8 h-8 text-orange-400" />
                </div>
                <h3 className="text-2xl font-black text-orange-400 drop-shadow-md mb-2">Σελίδα Εκτόνωσης</h3>
                <p className="text-sm text-slate-300 leading-relaxed">Γράψε τον θυμό, το άγχος ή ό,τι σε βαραίνει. Δεν αποθηκεύεται πουθενά. Δες το να γίνεται στάχτη.</p>
            </div>

            <div className={`w-full transition-all duration-[2000ms] ${isBurning ? 'opacity-0 scale-90 -translate-y-20 blur-md sepia hue-rotate-[-50deg] brightness-150' : 'opacity-100 scale-100 translate-y-0'}`}>
                <div className="bg-white/5 backdrop-blur-xl p-5 rounded-[2rem] border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                    <textarea
                        value={text} onChange={(e) => setText(e.target.value)}
                        disabled={isBurning}
                        placeholder="Θέλω να ουρλιάξω γιατί..."
                        className="w-full h-48 bg-black/20 border border-white/10 rounded-2xl p-4 text-base text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50 resize-none transition-colors shadow-inner"
                    />
                </div>
            </div>

            <button 
                onClick={handleBurn}
                disabled={isBurning || !text.trim()}
                className="w-full py-4 mt-4 rounded-2xl bg-orange-600/90 text-white font-bold shadow-[0_0_20px_rgba(234,88,12,0.4)] disabled:opacity-50 backdrop-blur-md active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
                {isBurning ? "Καίγεται..." : <><Flame className="w-5 h-5" /> Κάψε το οριστικά</>}
            </button>
        </div>
    );
}

function MoodTracker({ userId, onLog }: { userId?: string, onLog: () => void }) {
    const MOODS = [
        { id: 'great', icon: <Sun className="w-8 h-8" />, label: 'Τέλεια', color: 'bg-emerald-500 text-emerald-100 border-emerald-400' },
        { id: 'good', icon: <CloudSun className="w-8 h-8" />, label: 'Καλά', color: 'bg-blue-500 text-blue-100 border-blue-400' },
        { id: 'meh', icon: <Cloud className="w-8 h-8" />, label: 'Μέτρια', color: 'bg-amber-500 text-amber-100 border-amber-400' },
        { id: 'bad', icon: <CloudRain className="w-8 h-8" />, label: 'Άσχημα', color: 'bg-orange-500 text-orange-100 border-orange-400' },
        { id: 'awful', icon: <CloudLightning className="w-8 h-8" />, label: 'Χάλια', color: 'bg-red-500 text-red-100 border-red-400' },
    ];

    const MONTH_NAMES = ["Ιανουάριος", "Φεβρουάριος", "Μάρτιος", "Απρίλιος", "Μάιος", "Ιούνιος", "Ιούλιος", "Αύγουστος", "Σεπτέμβριος", "Οκτώβριος", "Νοέμβριος", "Δεκέμβριος"];
    const DAYS_OF_WEEK = ["Δ", "Τ", "Τ", "Π", "Π", "Σ", "Κ"];

    const [entries, setEntries] = useState<MoodEntry[]>(() => JSON.parse(localStorage.getItem('moodEntries') || '[]'));
    const [selectedMood, setSelectedMood] = useState<string | null>(null);
    const [note, setNote] = useState("");
    
    const [viewDate, setViewDate] = useState(new Date());
    const [selectedEntry, setSelectedEntry] = useState<MoodEntry | null>(null);
    const [entryToDelete, setEntryToDelete] = useState<string | null>(null);

    useEffect(() => {
        if (userId) {
            getUserMoods(userId).then(fetchedEntries => {
                if (fetchedEntries && fetchedEntries.length > 0) {
                    setEntries(fetchedEntries);
                    localStorage.setItem('moodEntries', JSON.stringify(fetchedEntries));
                }
            });
        }
    }, [userId]);

    const getFormattedDate = (dateObj: Date) => {
        const dd = dateObj.getDate().toString().padStart(2, '0');
        const mm = (dateObj.getMonth() + 1).toString().padStart(2, '0');
        const yyyy = dateObj.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    };

    const todayString = getFormattedDate(new Date());
    const hasLoggedToday = entries.some(e => e.date === todayString);

    const updateAndSaveEntries = (newEntries: MoodEntry[]) => {
        setEntries(newEntries);
        localStorage.setItem('moodEntries', JSON.stringify(newEntries));
        if (userId) {
            saveUserMoods(userId, newEntries);
        }
    };

    const handleSave = () => {
        if (!selectedMood) return;
        const newEntries = [{ date: todayString, mood: selectedMood, note }, ...entries];
        updateAndSaveEntries(newEntries);
        onLog();
        if (navigator.vibrate) navigator.vibrate(20);
        setSelectedMood(null);
        setNote("");
    };

    const executeDelete = () => {
        if (!entryToDelete) return;
        const newEntries = entries.filter(e => e.date !== entryToDelete);
        updateAndSaveEntries(newEntries);
        setEntryToDelete(null);
        setSelectedEntry(null); 
        if (navigator.vibrate) navigator.vibrate([50, 50]);
    };

    const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1; 

    const renderCalendarDays = () => {
        const grid = [];
        for (let i = 0; i < startOffset; i++) {
            grid.push(<div key={`empty-${i}`} className="w-full aspect-square"></div>);
        }
        for (let d = 1; d <= daysInMonth; d++) {
            const dateObj = new Date(year, month, d);
            const dStr = getFormattedDate(dateObj);
            
            const entry = entries.find(e => e.date === dStr);
            const isToday = dStr === todayString;
            const moodObj = entry ? MOODS.find(m => m.id === entry.mood) : null;
            const bgColorClass = moodObj ? moodObj.color.split(' ')[0] : 'bg-transparent';

            grid.push(
                <button 
                    key={d} 
                    onClick={() => entry ? setSelectedEntry(entry) : null}
                    className={`w-full aspect-square rounded-xl flex items-center justify-center relative transition-all duration-300
                        ${entry ? `cursor-pointer hover:scale-110 shadow-sm ${bgColorClass} bg-opacity-80 backdrop-blur-sm border border-white/20 text-white` : 'opacity-50'} 
                        ${isToday && !entry ? 'border border-white/30 bg-white/5' : ''}
                    `}
                >
                    {entry ? (
                        <span className="scale-75 drop-shadow-md">{moodObj?.icon}</span>
                    ) : (
                        <span className="text-xs text-slate-400 font-medium">{d}</span>
                    )}
                </button>
            );
        }
        return grid;
    };

    return (
        <div className="flex flex-col items-center w-full max-w-sm mx-auto animate-fade-in gap-5 pt-2 pb-6 relative">
            {!hasLoggedToday ? (
                <div className="w-full bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                    <h3 className="text-xl font-bold text-white text-center mb-6">Πώς νιώθεις σήμερα;</h3>
                    <div className="flex justify-between gap-2 mb-6">
                        {MOODS.map(m => (
                            <button 
                                key={m.id} 
                                onClick={() => setSelectedMood(m.id)}
                                className={`flex flex-col items-center gap-2 transition-transform text-white ${selectedMood === m.id ? 'scale-125 text-emerald-400' : 'opacity-60 hover:opacity-100'}`}
                            >
                                <div className="drop-shadow-md">{m.icon}</div>
                                {selectedMood === m.id && <span className="text-[9px] font-bold uppercase">{m.label}</span>}
                            </button>
                        ))}
                    </div>
                    {selectedMood && (
                        <div className="animate-fade-in">
                            <input 
                                type="text" value={note} onChange={e=>setNote(e.target.value)}
                                placeholder="Μια λέξη ή σκέψη (προαιρετικά)..."
                                className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white outline-none mb-4 shadow-inner"
                            />
                            <button onClick={handleSave} className="w-full py-3 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-400 transition shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2"><Check className="w-4 h-4" /> Αποθήκευση</button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="w-full bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl text-center shadow-sm">
                    <p className="text-emerald-400 text-sm font-bold flex items-center justify-center gap-2"><Check className="w-4 h-4" /> Καταγράφηκε για σήμερα!</p>
                </div>
            )}

            <div className="w-full bg-white/5 backdrop-blur-xl rounded-[2rem] p-5 border border-white/10 mt-2 shadow-lg">
                <div className="flex justify-between items-center mb-6 px-2">
                    <button onClick={prevMonth} className="text-slate-400 hover:text-white w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"><ChevronLeft className="w-5 h-5"/></button>
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">{MONTH_NAMES[month]} {year}</h4>
                    <button onClick={nextMonth} className="text-slate-400 hover:text-white w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"><ChevronLeft className="w-5 h-5 rotate-180"/></button>
                </div>
                <div className="grid grid-cols-7 gap-2 mb-3">
                    {DAYS_OF_WEEK.map(d => <div key={d} className="text-center text-[10px] text-slate-500 font-bold">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-2">
                    {renderCalendarDays()}
                </div>
            </div>

            {selectedEntry && (
                <div className="fixed inset-0 z-[990] flex items-center justify-center p-4 bg-black/80 backdrop-blur-lg animate-fade-in" onClick={() => setSelectedEntry(null)}>
                    <div className="bg-slate-900/90 border border-white/10 p-6 rounded-[2rem] w-full max-w-xs text-center shadow-2xl relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSelectedEntry(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white bg-white/5 rounded-full w-8 h-8 flex items-center justify-center transition"><X className="w-4 h-4"/></button>
                        <p className="text-xs text-slate-400 font-bold tracking-widest uppercase mb-4 mt-2">{selectedEntry.date}</p>
                        
                        {(() => {
                            const m = MOODS.find(x => x.id === selectedEntry.mood);
                            return (
                                <>
                                    <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(0,0,0,0.3)] ${m?.color.split(' ')[0]} bg-opacity-20 border border-white/10 text-white`}>
                                        <div className="scale-[1.5]">{m?.icon}</div>
                                    </div>
                                    <h3 className="text-xl font-black text-white mb-2">{m?.label}</h3>
                                    {selectedEntry.note ? (
                                        <div className="bg-black/20 p-4 rounded-2xl border border-white/5 mb-6">
                                            <p className="text-sm text-slate-300 italic">"{selectedEntry.note}"</p>
                                        </div>
                                    ) : (
                                        <div className="mb-6"></div>
                                    )}
                                </>
                            );
                        })()}

                        <div className="flex gap-3">
                            <button onClick={() => setSelectedEntry(null)} className="flex-1 py-3 rounded-xl bg-white/5 text-slate-300 font-bold text-sm hover:bg-white/10 transition">Κλείσιμο</button>
                            <button onClick={() => setEntryToDelete(selectedEntry.date)} className="flex-1 py-3 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-sm hover:bg-red-500 hover:text-white transition flex items-center justify-center gap-2"><Trash2 className="w-4 h-4"/> Διαγραφή</button>
                        </div>
                    </div>
                </div>
            )}

            {entryToDelete && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-lg animate-fade-in" onClick={() => setEntryToDelete(null)}>
                    <div className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 p-6 rounded-[2rem] w-full max-w-[280px] shadow-2xl text-center transform scale-100 transition-all" onClick={e => e.stopPropagation()}>
                        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center text-3xl mb-4 mx-auto shadow-[0_0_30px_rgba(239,68,68,0.4)] animate-bounce border border-red-500/30">
                            <Trash2 className="w-8 h-8 text-red-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Διαγραφή Ημέρας</h3>
                        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                            Θέλεις σίγουρα να διαγράψεις το συναίσθημα αυτής της ημέρας;
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setEntryToDelete(null)} className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-bold text-sm hover:bg-white/10 transition backdrop-blur-sm">Άκυρο</button>
                            <button onClick={executeDelete} className="flex-1 py-3 rounded-xl bg-red-600/90 backdrop-blur-md border border-red-500/50 text-white font-bold text-sm hover:bg-red-500 transition shadow-[0_0_20px_rgba(239,68,68,0.3)]">Διαγραφή</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function FocusTimer({ onComplete }: { onComplete: () => void }) {
    const TOTAL_TIME = 15 * 60; 
    const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
    const [isActive, setIsActive] = useState(false);
    const [goal, setGoal] = useState("");
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0 && isActive) {
            setIsActive(false);
            if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
            alert("Μπράβο! Ολοκλήρωσες τον χρόνο εστίασης.");
            onComplete();
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const toggleTimer = () => {
        if (!isActive) {
            if (!audioRef.current) {
                audioRef.current = new Audio('/sounds/white.mp3'); 
                audioRef.current.loop = true;
                audioRef.current.volume = 0.3;
            }
            audioRef.current.play().catch(()=>{});
        } else {
            if (audioRef.current) audioRef.current.pause();
        }
        setIsActive(!isActive);
    };

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(TOTAL_TIME);
        if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const progress = ((TOTAL_TIME - timeLeft) / TOTAL_TIME) * 100;

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-sm mx-auto animate-fade-in gap-8 pt-4 pb-6 min-h-[400px]">
            
            <div className="w-full px-4 text-center">
                <input 
                    type="text" value={goal} onChange={e=>setGoal(e.target.value)}
                    disabled={isActive}
                    placeholder="Τι θέλεις να κάνεις τώρα; (π.χ. Διάβασμα)"
                    className="w-full bg-transparent border-b border-white/20 text-center text-lg font-bold text-white placeholder-slate-500 outline-none pb-2 focus:border-indigo-400 transition-colors disabled:opacity-50"
                />
            </div>

            <div className="relative flex items-center justify-center mt-4">
                <svg className="w-64 h-64 -rotate-90 drop-shadow-xl">
                    <circle cx="128" cy="128" r="120" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                    <circle 
                        cx="128" cy="128" r="120" fill="none" stroke="#818cf8" strokeWidth="8" strokeLinecap="round"
                        strokeDasharray="754" strokeDashoffset={754 - (progress / 100) * 754}
                        className="transition-all duration-1000 ease-linear shadow-[0_0_20px_rgba(129,140,248,0.5)]"
                    />
                </svg>
                <div className="absolute flex flex-col items-center">
                    <span className="text-5xl font-mono font-black text-white drop-shadow-md">{formatTime(timeLeft)}</span>
                    {isActive && <span className="text-xs text-indigo-300 font-bold tracking-widest uppercase mt-2 animate-pulse">Εστιαση...</span>}
                </div>
            </div>

            <div className="flex gap-4">
                <button onClick={toggleTimer} className="w-16 h-16 rounded-full bg-indigo-500 flex items-center justify-center text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] active:scale-95 transition">
                    {isActive ? <Pause className="w-8 h-8" fill="currentColor" /> : <Play className="w-8 h-8 ml-1" fill="currentColor" />}
                </button>
                <button onClick={resetTimer} className="w-16 h-16 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition active:scale-95 border border-white/10">
                    <RefreshCw className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
}

function GratitudeJar({ onAdd }: { onAdd?: () => void }) {
    const [notes, setNotes] = useState<string[]>(() => JSON.parse(localStorage.getItem('gratitudeNotes') || '[]'));
    const [inputText, setInputText] = useState("");
    const [drawnNote, setDrawnNote] = useState<{text: string, index: number} | null>(null);
    const [showList, setShowList] = useState(false);
    const [showConfirmEmpty, setShowConfirmEmpty] = useState(false);

    useEffect(() => { localStorage.setItem('gratitudeNotes', JSON.stringify(notes)); }, [notes]);

    const handleAdd = () => {
        if (!inputText.trim()) return;
        setNotes([inputText, ...notes]);
        setInputText("");
        if (onAdd) onAdd();
        if (navigator.vibrate) navigator.vibrate(20);
    };

    const drawRandom = () => {
        if (notes.length === 0) return;
        const randomIndex = Math.floor(Math.random() * notes.length);
        setDrawnNote({ text: notes[randomIndex], index: randomIndex });
        if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
    };

    const deleteNote = (indexToRemove: number) => { setNotes(notes.filter((_, index) => index !== indexToRemove)); };

    return (
        <div className="flex flex-col items-center w-full max-w-sm mx-auto animate-fade-in gap-6 pt-4 pb-6 relative">
            <div className="w-full flex justify-between items-start px-2">
                <div className="text-left flex-1 pr-2">
                    <h3 className="text-2xl font-black text-amber-400 drop-shadow-md mb-1">Βάζο των Θετικών</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">Γράψε μια καλή στιγμή ή κάτι για το οποίο νιώθεις ευγνωμοσύνη.</p>
                </div>
                <div className="flex flex-col gap-2 shrink-0 items-end">
                    <button onClick={() => setShowList(true)} disabled={notes.length === 0} className="text-[10px] font-bold text-slate-400 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 hover:text-white transition disabled:opacity-50 w-full flex items-center justify-center gap-1"><List className="w-3 h-3"/> Λίστα</button>
                    <button onClick={() => setShowConfirmEmpty(true)} disabled={notes.length === 0} className="text-[10px] font-bold text-slate-400 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 hover:text-red-400 transition disabled:opacity-50 w-full flex items-center justify-center gap-1"><Trash2 className="w-3 h-3"/> Άδειασμα</button>
                </div>
            </div>

            <div className="relative w-40 h-48 bg-white/5 backdrop-blur-md rounded-[2.5rem] border-2 border-white/20 shadow-[0_0_40px_rgba(251,191,36,0.15)] flex items-end justify-center pb-4 overflow-hidden">
                <div className="absolute top-0 w-24 h-6 bg-white/10 border-b-2 border-white/20 rounded-b-xl"></div>
                <div className="relative w-full h-2/3 flex flex-wrap-reverse items-end justify-center gap-1 px-4 opacity-70">
                    {notes.slice(0, 15).map((_, i) => (
                        <div key={i} className={`w-8 h-8 rounded-md shadow-sm border border-white/10 ${i%2===0 ? 'bg-amber-400/80 rotate-12' : i%3===0 ? 'bg-emerald-400/80 -rotate-12' : 'bg-rose-400/80 rotate-6'}`}></div>
                    ))}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent"></div>
            </div>

            <div className="w-full bg-black/20 p-2 rounded-3xl border border-white/5 flex gap-2 shadow-inner">
                <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Π.χ. Σήμερα κατάφερα να βγω βόλτα..." className="flex-1 bg-transparent text-sm text-white px-4 outline-none placeholder:text-slate-500" />
                <button onClick={handleAdd} disabled={!inputText.trim()} className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold disabled:opacity-50 disabled:bg-white/10 transition-all active:scale-95 shrink-0"><Plus className="w-5 h-5"/></button>
            </div>

            <button onClick={drawRandom} disabled={notes.length === 0} className="w-full py-4 rounded-2xl bg-amber-500/90 text-white font-bold shadow-[0_0_20px_rgba(245,158,11,0.4)] disabled:opacity-50 backdrop-blur-md active:scale-95 transition-transform mt-4 flex items-center justify-center gap-2">
                {notes.length === 0 ? "Το βάζο είναι άδειο" : <><Archive className="w-5 h-5"/> Τράβα ένα χαρτάκι</>}
            </button>

            {drawnNote && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-6 bg-black/80 backdrop-blur-lg animate-fade-in" onClick={() => setDrawnNote(null)}>
                    <div className="bg-amber-100 p-8 rounded-[2rem] w-full max-w-xs shadow-2xl text-center transform rotate-2 flex flex-col" onClick={e => e.stopPropagation()}>
                        <Archive className="w-10 h-10 text-amber-500 mx-auto mb-4 drop-shadow-md" />
                        <p className="text-lg font-bold text-amber-900 leading-relaxed font-serif flex-1">"{drawnNote.text}"</p>
                        <div className="mt-8 flex gap-3 w-full">
                            <button onClick={() => { deleteNote(drawnNote.index); setDrawnNote(null); }} className="flex-1 px-4 py-3 bg-red-100/80 text-red-700 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-red-200 transition border border-red-200 flex items-center justify-center gap-1"><Trash2 className="w-4 h-4"/> Διαγραφή</button>
                            <button onClick={() => setDrawnNote(null)} className="flex-1 px-4 py-3 bg-amber-200 text-amber-800 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-amber-300 transition border border-amber-300">Κλείσιμο</button>
                        </div>
                    </div>
                </div>
            )}

            {showList && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-lg animate-fade-in" onClick={() => setShowList(false)}>
                    <div className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 p-6 rounded-[2rem] w-full max-w-sm shadow-2xl relative max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-amber-400">Όλες οι Σημειώσεις</h3>
                            <button onClick={() => setShowList(false)} className="w-8 h-8 rounded-full bg-white/5 text-slate-400 flex items-center justify-center hover:bg-white/10 hover:text-white transition"><X className="w-4 h-4"/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-3 scrollbar-hide pr-1">
                            {notes.map((note, index) => (
                                <div key={index} className="bg-black/20 p-4 rounded-2xl border border-white/5 flex justify-between items-center gap-3">
                                    <p className="text-sm text-slate-300 leading-relaxed line-clamp-3">{note}</p>
                                    <button onClick={() => deleteNote(index)} className="w-10 h-10 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition shrink-0"><Trash2 className="w-4 h-4"/></button>
                                </div>
                            ))}
                        </div>
                        {notes.length === 0 && <p className="text-center text-slate-500 text-sm mt-4 italic">Δεν υπάρχουν σημειώσεις.</p>}
                    </div>
                </div>
            )}

            {showConfirmEmpty && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-lg animate-fade-in" onClick={() => setShowConfirmEmpty(false)}>
                    <div className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 p-6 rounded-[2rem] w-full max-w-[280px] shadow-2xl text-center transform scale-100 transition-all" onClick={e => e.stopPropagation()}>
                        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(239,68,68,0.4)] animate-bounce border border-red-500/30 mb-4">
                            <Trash2 className="w-8 h-8 text-red-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Άδειασμα Βάζου</h3>
                        <p className="text-slate-400 text-sm mb-6 leading-relaxed">Θέλεις σίγουρα να διαγράψεις όλες τις σημειώσεις σου; Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowConfirmEmpty(false)} className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-bold text-sm hover:bg-white/10 transition backdrop-blur-sm">Άκυρο</button>
                            <button onClick={() => { setNotes([]); setShowConfirmEmpty(false); if (navigator.vibrate) navigator.vibrate([50, 50]); }} className="flex-1 py-3 rounded-xl bg-red-600/90 backdrop-blur-md border border-red-500/50 text-white font-bold text-sm hover:bg-red-500 transition shadow-[0_0_20px_rgba(239,68,68,0.3)]">Διαγραφή</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function SOSProtocol({ onUse }: { onUse?: () => void }) {
    const defaultSteps = [
        { id: '1', text: "Πιες ένα ποτήρι παγωμένο νερό.", done: false },
        { id: '2', text: "Πλύνε το πρόσωπό σου με κρύο νερό.", done: false },
        { id: '3', text: "Βάλε το αγαπημένο σου χαλαρωτικό τραγούδι.", done: false },
        { id: '4', text: "Πάρε τηλέφωνο ένα αγαπημένο πρόσωπο.", done: false }
    ];

    const [steps, setSteps] = useState<{id: string, text: string, done: boolean}[]>(() => {
        const saved = localStorage.getItem('sosProtocol');
        return saved ? JSON.parse(saved) : defaultSteps;
    });
    
    const [isEditing, setIsEditing] = useState(false);
    const [newStepText, setNewStepText] = useState("");

    useEffect(() => { localStorage.setItem('sosProtocol', JSON.stringify(steps)); }, [steps]);

    const toggleStep = (id: string) => {
        if(isEditing) return;
        setSteps(steps.map(s => s.id === id ? {...s, done: !s.done} : s));
        if (navigator.vibrate) navigator.vibrate(10);
    };

    const addStep = () => {
        if (!newStepText.trim()) return;
        setSteps([...steps, { id: Date.now().toString(), text: newStepText, done: false }]);
        setNewStepText("");
    };

    const removeStep = (id: string) => { setSteps(steps.filter(s => s.id !== id)); };
    const resetChecks = () => { 
        setSteps(steps.map(s => ({...s, done: false}))); 
        if (onUse) onUse();
    };

    const progress = steps.length === 0 ? 0 : Math.round((steps.filter(s => s.done).length / steps.length) * 100);

    return (
        <div className="flex flex-col items-center w-full max-w-sm mx-auto animate-fade-in gap-5 pt-2 pb-6">
            <div className="w-full flex justify-between items-end px-2 mb-2">
                <div>
                    <h3 className="text-2xl font-black text-blue-400 drop-shadow-md">Το Πλάνο Μου</h3>
                    <p className="text-xs text-slate-300 mt-1">Ακολούθησε τα βήματα ένα-ένα.</p>
                </div>
                <button onClick={() => setIsEditing(!isEditing)} className="text-xs font-bold text-slate-400 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 hover:text-white transition flex items-center gap-1">
                    {isEditing ? <><Check className="w-3 h-3"/> Τέλος</> : <><Pencil className="w-3 h-3"/> Επεξεργασία</>}
                </button>
            </div>

            {!isEditing && (
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5 mb-2">
                    <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
                </div>
            )}

            <div className="w-full space-y-3 pb-4">
                {steps.map((step, index) => (
                    <div key={step.id} onClick={() => toggleStep(step.id)} className={`p-4 rounded-2xl border transition-all duration-300 flex items-center gap-4 ${isEditing ? 'bg-white/5 border-white/10' : step.done ? 'bg-blue-900/20 border-blue-500/30 opacity-60' : 'bg-white/10 border-white/20 shadow-md cursor-pointer hover:bg-white/20 active:scale-[0.98]'}`}>
                        {!isEditing && <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${step.done ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-400 text-transparent'}`}><Check className="w-4 h-4"/></div>}
                        <div className="flex-1">
                            {!isEditing && <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">ΒΗΜΑ {index + 1}</p>}
                            <p className={`text-sm text-white ${step.done && !isEditing ? 'line-through decoration-blue-500/50' : ''}`}>{step.text}</p>
                        </div>
                        {isEditing && <button onClick={(e) => { e.stopPropagation(); removeStep(step.id); }} className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center flex-shrink-0 hover:bg-red-500 hover:text-white transition"><X className="w-4 h-4"/></button>}
                    </div>
                ))}

                {isEditing && (
                    <div className="w-full bg-black/20 p-1.5 rounded-2xl border border-white/5 flex gap-2 shadow-inner mt-4">
                        <input type="text" value={newStepText} onChange={(e) => setNewStepText(e.target.value)} placeholder="Πρόσθεσε νέο βήμα..." className="flex-1 min-w-0 bg-transparent text-sm text-white px-2 outline-none placeholder:text-slate-500" />
                        <button onClick={addStep} disabled={!newStepText.trim()} className="px-3 py-2 text-xs rounded-xl bg-blue-500 text-white font-bold disabled:opacity-50 transition-all shrink-0">Προσθήκη</button>
                    </div>
                )}
            </div>

            {!isEditing && progress === 100 && (
                <div className="flex justify-center animate-fade-in mt-4">
                    <button onClick={resetChecks} className="bg-blue-600/90 backdrop-blur-md text-white px-6 py-3 rounded-full font-bold shadow-[0_0_30px_rgba(59,130,246,0.4)] border border-blue-400/50 flex items-center gap-2"><RefreshCw className="w-4 h-4"/> Επαναφορά</button>
                </div>
            )}
        </div>
    );
}

function WorryBox({ onAdd }: { onAdd?: () => void }) {
    const [text, setText] = useState("");
    const [worries, setWorries] = useState<WorryItem[]>(() => JSON.parse(localStorage.getItem('myWorries') || '[]'));
    const [activeWorry, setActiveWorry] = useState<WorryItem | null>(null);

    useEffect(() => { localStorage.setItem('myWorries', JSON.stringify(worries)); }, [worries]);

    return (
        <div className="flex flex-col w-full max-w-sm mx-auto animate-fade-in gap-5 relative pb-6 pt-2">
            <div className="bg-white/5 backdrop-blur-xl p-5 rounded-[2rem] border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] shrink-0">
                <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-lg"><Inbox className="w-5 h-5 text-slate-400"/> Το Κουτί Ανησυχιών</h3>
                <textarea
                    value={text} onChange={(e) => setText(e.target.value)}
                    placeholder="Τι σε απασχολεί; Γράψ' το εδώ, δες το καθαρά..."
                    className="w-full h-24 bg-black/20 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 resize-none transition-colors shadow-inner"
                />
                <button
                    onClick={() => {
                        if (!text.trim()) return;
                        setWorries([{ id: Date.now().toString(), text, date: new Date().toLocaleDateString('el-GR'), solved: false }, ...worries]);
                        setText(""); if (onAdd) onAdd(); if (navigator.vibrate) navigator.vibrate(20);
                    }}
                    disabled={!text.trim()}
                    className={`w-full mt-3 py-3 rounded-xl font-bold text-sm transition-all ${!text.trim() ? 'bg-white/5 text-slate-500 cursor-not-allowed' : 'bg-emerald-500/80 text-white hover:bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] backdrop-blur-md'}`}
                >
                    Αποθήκευση στο Κουτί
                </button>
            </div>

            <div className="w-full space-y-4">
                {worries.length === 0 && <p className="text-center text-slate-500 text-sm mt-10 italic">Το κουτί είναι άδειο.<br/>Το μυαλό σου είναι ήρεμο.</p>}
                {worries.map(w => (
                    <div key={w.id} className={`p-5 rounded-3xl border transition-all duration-300 backdrop-blur-md shadow-lg ${w.solved ? 'bg-emerald-900/10 border-emerald-500/20 opacity-60' : 'bg-white/5 border-white/10'}`}>
                        <div className="flex justify-between items-start mb-3">
                            <span className="text-[10px] text-slate-400 font-medium">{w.date}</span>
                            {w.solved && <span className="text-[10px] text-emerald-400 font-bold border border-emerald-500/30 px-2 py-0.5 rounded-full bg-emerald-500/10 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> ΛΥΘΗΚΕ</span>}
                        </div>
                        <p className={`text-white text-sm mb-5 leading-relaxed ${w.solved ? 'line-through text-slate-400' : ''}`}>{w.text}</p>
                        <div className="flex gap-2 justify-end">
                            {!w.solved && <button onClick={() => setActiveWorry(w)} className="px-3 py-2 rounded-xl bg-blue-500/10 text-blue-400 text-xs font-bold border border-blue-500/20 hover:bg-blue-500/20 transition backdrop-blur-sm flex items-center gap-1"><Brain className="w-3 h-3"/> Αντιμετώπιση</button>}
                            <button onClick={() => setWorries(worries.map(x => x.id === w.id ? {...x, solved: !x.solved} : x))} className={`px-3 py-2 rounded-xl text-xs font-bold border transition backdrop-blur-sm flex items-center gap-1 ${w.solved ? 'bg-white/5 text-slate-400 border-white/10' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'}`}>{w.solved ? <><RefreshCw className="w-3 h-3"/> Επαναφορά</> : <><Check className="w-3 h-3"/> Λύθηκε</>}</button>
                            <button onClick={() => setWorries(worries.filter(x => x.id !== w.id))} className="px-3 py-2 rounded-xl bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/20 hover:bg-red-500/20 transition backdrop-blur-sm flex items-center gap-1"><Trash2 className="w-3 h-3"/> Κάψιμο</button>
                        </div>
                    </div>
                ))}
            </div>
            {activeWorry && <WorryConfrontModal worry={activeWorry} onClose={() => setActiveWorry(null)} />}
        </div>
    );
}

function WorryConfrontModal({ worry, onClose }: { worry: WorryItem, onClose: () => void }) {
    const [step, setStep] = useState(0);
    const questions = [
        { title: "Έλεγχος", q: "Είναι αυτή η κατάσταση στον έλεγχό σου;", sub: "Μπορείς να επηρεάσεις το αποτέλεσμα ή είναι κάτι που απλά συμβαίνει;" },
        { title: "Δράση", q: "Τι μπορείς να κάνεις γι' αυτό;", sub: "Σκέψου 1-2 πρακτικά βήματα." },
        { title: "Πραγματικότητα", q: "Είναι κάτι που συμβαίνει τώρα ή κάτι υποθετικό;", sub: "Συμβαίνει αυτή τη στιγμή ή είναι ένα σενάριο «τι θα γίνει αν...»;" },
        { title: "Διαστρέβλωση", q: "Μήπως δε τα βλέπεις όπως ακριβώς είναι;", sub: "Μήπως εστιάζεις μόνο στα αρνητικά και αγνοείς τα θετικά;" }
    ];

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-lg animate-fade-in">
            <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/10 p-6 rounded-[2rem] w-full max-w-[280px] shadow-2xl relative max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white bg-white/5 rounded-full w-8 h-8 flex items-center justify-center"><X className="w-4 h-4"/></button>
                <div className="mb-4 mt-2">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-2">ΒΗΜΑ {step + 1} / {questions.length}</p>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${((step + 1) / questions.length) * 100}%` }}></div>
                    </div>
                </div>
                <div className="min-h-[140px] flex flex-col justify-center text-center">
                    <h3 className="text-blue-400 font-bold text-base mb-2">{questions[step].title}</h3>
                    <p className="text-white text-lg font-bold mb-3 leading-tight">{questions[step].q}</p>
                    <p className="text-slate-400 text-xs italic">{questions[step].sub}</p>
                </div>
                <div className="mt-4 bg-black/20 p-3 rounded-2xl border border-white/5 mb-5 shadow-inner">
                    <p className="text-[10px] text-slate-500 mb-1 font-bold uppercase tracking-wide">Η ΣΚΕΨΗ ΣΟΥ:</p>
                    <p className="text-slate-300 text-xs italic line-clamp-3 leading-relaxed">"{worry.text}"</p>
                </div>
                <button onClick={() => step < questions.length - 1 ? setStep(prev => prev + 1) : onClose()} className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-500 transition shadow-[0_0_20px_rgba(59,130,246,0.4)]">
                    {step === questions.length - 1 ? "Ολοκλήρωση" : "Επόμενο"}
                </button>
            </div>
        </div>
    );
}

function GroundingExercise({ onComplete }: { onComplete?: () => void }) {
  const [step, setStep] = useState(0);
  const steps = [
    { icon: <Eye className="w-16 h-16 text-orange-400" />, count: "5", title: "Πράγματα που Βλέπεις", desc: "Κοίταξε γύρω σου. Βρες 5 αντικείμενα και πες τα δυνατά." },
    { icon: <Hand className="w-16 h-16 text-orange-400" />, count: "4", title: "Πράγματα που Αγγίζεις", desc: "Άγγιξε 4 διαφορετικές υφές." },
    { icon: <Ear className="w-16 h-16 text-orange-400" />, count: "3", title: "Ήχοι που Ακούς", desc: "Κλείσε τα μάτια. Ποιους 3 ήχους μπορείς να ξεχωρίσεις;" },
    { icon: <Wind className="w-16 h-16 text-orange-400" />, count: "2", title: "Μυρωδιές", desc: "Προσπάθησε να εντοπίσεις 2 μυρωδιές στο χώρο." },
    { icon: <Smile className="w-16 h-16 text-orange-400" />, count: "1", title: "Γεύση", desc: "Εστίασε σε 1 γεύση στο στόμα σου ή πιες λίγο νερό." }
  ];

  const handleNext = () => {
    if (step < 5) { setStep(prev => prev + 1); if (navigator.vibrate) navigator.vibrate(30); } 
    else { setStep(0); if (onComplete) onComplete(); } 
  };

  if (step === 5) return (
      <div className="flex flex-col items-center text-center animate-fade-in gap-6 p-6 w-full max-w-sm">
        <div className="w-32 h-32 rounded-full bg-orange-500/20 flex items-center justify-center mb-4 shadow-[0_0_60px_rgba(249,115,22,0.3)] animate-pulse border border-orange-500/30">
            <Check className="w-16 h-16 text-orange-400" />
        </div>
        <h3 className="text-3xl font-bold text-white">Μπράβο!</h3>
        <p className="text-slate-400 text-base leading-relaxed">Μόλις ολοκλήρωσες την τεχνική γείωσης. Πάρε μια βαθιά ανάσα.</p>
        <button onClick={handleNext} className="px-8 py-4 bg-white/10 text-white rounded-2xl font-bold hover:bg-white/20 transition w-full mt-4 border border-white/10 backdrop-blur-md">Από την αρχή</button>
      </div>
  );

  const current = steps[step];
  return (
    <div className="flex flex-col items-center justify-center w-full max-w-sm mx-auto animate-fade-in pb-10">
      <div className="w-full h-1.5 bg-white/5 rounded-full mb-10 flex overflow-hidden backdrop-blur-md">
        {steps.map((_, i) => <div key={i} className={`h-full flex-1 transition-all duration-500 ${i <= step ? "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]" : "bg-transparent"}`} />)}
      </div>
      <div className="relative mb-10 w-full">
        <div className="absolute inset-0 bg-orange-500/20 blur-[50px] rounded-full"></div>
        <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-[2.5rem] text-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex flex-col items-center gap-5">
          <div className="text-xs font-bold text-orange-400 uppercase tracking-widest border border-orange-500/30 px-4 py-1.5 rounded-full bg-orange-500/10">Bημα {step + 1} / 5</div>
          <div className="my-3 drop-shadow-2xl flex justify-center">{current.icon}</div>
          <div><h1 className="text-6xl font-black text-white mb-3 drop-shadow-md">{current.count}</h1><h3 className="text-xl font-bold text-orange-200">{current.title}</h3></div>
          <p className="text-slate-300 text-base leading-relaxed mt-2">{current.desc}</p>
        </div>
      </div>
      <button onClick={handleNext} className="w-full py-4 bg-orange-600/90 backdrop-blur-md text-white rounded-2xl font-bold text-lg shadow-[0_0_30px_rgba(234,88,12,0.4)] hover:bg-orange-50 active:scale-95 transition border border-orange-500/50 flex items-center justify-center gap-2"><Check className="w-5 h-5"/> Έγινε</button>
    </div>
  );
}

function BreathingExercise() {
  const [phase, setPhase] = useState("Εισπνοή");
  const [scale, setScale] = useState(1);
  const [instruction, setInstruction] = useState("Πάρε βαθιά ανάσα...");

  useEffect(() => {
    const cycle = () => {
      setPhase("Εισπνοή"); setInstruction("Αργά από τη μύτη..."); setScale(1.5); 
      setTimeout(() => {
        setPhase("Κράτημα"); setInstruction("Κράτα την αναπνοή σου..."); setScale(1.5); 
        setTimeout(() => {
          setPhase("Εκπνοή"); setInstruction("Αργά από το στόμα..."); setScale(1); 
        }, 4000);
      }, 4000);
    };
    cycle(); 
    const interval = setInterval(cycle, 12000); 
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center animate-fade-in w-full h-full justify-center">
      <div className="relative flex items-center justify-center w-80 h-80 shrink-0 mb-8">
        <div className={`absolute w-72 h-72 rounded-full blur-[60px] transition-all duration-[4000ms] ${phase === 'Εισπνοή' ? 'bg-emerald-500/40' : 'bg-blue-500/20'}`}></div>
        <div className="w-48 h-48 rounded-full border border-white/20 flex items-center justify-center transition-all duration-[4000ms] ease-in-out shadow-[0_0_80px_rgba(16,185,129,0.3)] bg-white/5 backdrop-blur-xl z-10" style={{ transform: `scale(${scale})` }}>
          <span className="text-2xl font-bold text-white transition-opacity duration-500 drop-shadow-lg">{phase}</span>
        </div>
      </div>
      <div className="text-center space-y-4 px-4 z-20">
        <p className="text-emerald-300 font-bold text-3xl transition-all duration-500 drop-shadow-md">{instruction}</p>
        <p className="text-slate-400 text-sm">Ακολούθησε τον ρυθμό του κύκλου.</p>
      </div>
    </div>
  );
}

function RewardsScreen({ points, onRedeem }: { points: number, onRedeem: (cost: number) => void }) {
    const [selectedReward, setSelectedReward] = useState<any>(null);
    const [showSuccess, setShowSuccess] = useState<{name: string, code: string} | null>(null);

    // Προσωρινά, mock δεδομένα κατηγοριοποιημένα
    const REWARDS = [
        {
            category: "Χαλάρωση & Wellness",
            items: [
                { id: "w1", title: "Έκπτωση 10% σε Αιθέρια Έλαια", cost: 150, icon: "🌿", desc: "Κουπόνι για αγορές σε συνεργαζόμενο e-shop." },
                { id: "w2", title: "Δωρεάν Ρόφημα", cost: 300, icon: "☕", desc: "Ένα δωρεάν ζεστό ρόφημα σε επιλεγμένα καφέ." },
                { id: "w3", title: "1 Μήνας Διαλογισμός (Premium)", cost: 1200, icon: "🧘", desc: "Ξεκλείδωσε premium ήχους και καθοδηγούμενο διαλογισμό." }
            ]
        },
        {
            category: "Αυτοβελτίωση",
            items: [
                { id: "g1", title: "E-book: 'Διαχείριση Άγχους'", cost: 400, icon: "📘", desc: "Κατέβασε δωρεάν τον οδηγό τσέπης." },
                { id: "g2", title: "-20% σε Βιβλία Ψυχολογίας", cost: 600, icon: "📚", desc: "Ισχύει για τις εκδόσεις Ψυχολογία." },
                { id: "g3", title: "Online Σεμινάριο Ενσυνειδητότητας", cost: 1500, icon: "🎓", desc: "Δωρεάν εισιτήριο για το επόμενο webinar." }
            ]
        },
        {
            category: "Ψυχαγωγία",
            items: [
                { id: "e1", title: "1 Μήνας Premium Μουσική", cost: 2000, icon: "🎵", desc: "Απεριόριστη μουσική χωρίς διαφημίσεις." },
                { id: "e2", title: "2 Εισιτήρια Σινεμά", cost: 2500, icon: "🍿", desc: "Για να πας με την παρέα σου σε όποια ταινία θες." }
            ]
        }
    ];

    const handleConfirm = () => {
        if (!selectedReward || points < selectedReward.cost) return;
        
        onRedeem(selectedReward.cost);
        if (navigator.vibrate) navigator.vibrate([50, 100, 50]);
        
        // Δημιουργία τυχαίου mock κωδικού
        const mockCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        setShowSuccess({ name: selectedReward.title, code: mockCode });
        setSelectedReward(null);
    };

    return (
        <div className="flex flex-col w-full max-w-sm mx-auto animate-fade-in gap-6 pb-6 pt-2">
            
            {/* Header Πόντων */}
            <div className="bg-gradient-to-br from-amber-500/20 to-orange-600/20 backdrop-blur-xl p-6 rounded-[2rem] border border-amber-500/30 shadow-[0_8px_30px_rgba(245,158,11,0.15)] flex flex-col items-center justify-center text-center shrink-0">
                <Gift className="w-10 h-10 text-amber-400 mb-2 drop-shadow-md" />
                <p className="text-xs text-amber-200 font-bold uppercase tracking-widest mb-1">Διαθεσιμοι Ποντοι</p>
                <h2 className="text-5xl font-black text-white drop-shadow-lg font-mono">{points}</h2>
            </div>

            {/* Λίστα Ανταμοιβών */}
            <div className="space-y-8">
                {REWARDS.map((section, idx) => (
                    <div key={idx} className="space-y-3">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-2 border-b border-white/10 pb-2">{section.category}</h3>
                        
                        {/* Ταξινόμηση βάσει κόστους αύξουσα */}
                        {section.items.sort((a, b) => a.cost - b.cost).map(item => {
                            const isLocked = points < item.cost;
                            
                            return (
                                <button 
                                    key={item.id}
                                    onClick={() => !isLocked && setSelectedReward(item)}
                                    disabled={isLocked}
                                    className={`w-full flex items-center p-4 rounded-3xl border transition-all duration-300 text-left
                                        ${isLocked 
                                            ? 'bg-black/40 border-white/5 opacity-60 grayscale cursor-not-allowed' 
                                            : 'bg-white/5 border-white/10 hover:bg-white/10 active:scale-95 shadow-lg'
                                        }`}
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-2xl shrink-0 shadow-inner border border-white/5 relative">
                                        {item.icon}
                                        {isLocked && (
                                            <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center backdrop-blur-[1px]">
                                                <Lock className="w-5 h-5 text-white opacity-80" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="ml-4 flex-1">
                                        <h4 className="font-bold text-white text-sm leading-tight">{item.title}</h4>
                                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{item.desc}</p>
                                    </div>
                                    <div className={`shrink-0 ml-2 px-3 py-1.5 rounded-xl text-xs font-bold font-mono border ${isLocked ? 'bg-slate-900/50 text-slate-500 border-slate-700/50' : 'bg-amber-500/20 text-amber-400 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]'}`}>
                                        {item.cost}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* Modal Επιβεβαίωσης */}
            {selectedReward && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-lg animate-fade-in" onClick={() => setSelectedReward(null)}>
                    <div className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 p-6 rounded-[2rem] w-full max-w-[280px] shadow-2xl text-center transform scale-100 transition-all" onClick={e => e.stopPropagation()}>
                        <div className="text-5xl mb-4 drop-shadow-lg">{selectedReward.icon}</div>
                        <h3 className="text-xl font-bold text-white mb-2 leading-tight">{selectedReward.title}</h3>
                        <p className="text-slate-400 text-sm mb-6 leading-relaxed">Θέλεις να εξαργυρώσεις <strong className="text-amber-400">{selectedReward.cost} πόντους</strong> για αυτή την ανταμοιβή;</p>
                        
                        <div className="flex gap-3">
                            <button onClick={() => setSelectedReward(null)} className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-bold text-sm hover:bg-white/10 transition backdrop-blur-sm">Άκυρο</button>
                            <button onClick={handleConfirm} className="flex-1 py-3 rounded-xl bg-amber-500/90 backdrop-blur-md border border-amber-400/50 text-white font-bold text-sm hover:bg-amber-500 transition shadow-[0_0_20px_rgba(245,158,11,0.4)]">Εξαργύρωση</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Επιτυχίας & Κωδικού */}
            {showSuccess && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-lg animate-fade-in" onClick={() => setShowSuccess(null)}>
                    <div className="bg-emerald-950/90 backdrop-blur-2xl border border-emerald-500/30 p-6 rounded-[2rem] w-full max-w-[280px] shadow-2xl text-center transform scale-100 transition-all" onClick={e => e.stopPropagation()}>
                        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4 border border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                            <Gift className="w-8 h-8 text-emerald-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Συγχαρητήρια!</h3>
                        <p className="text-emerald-200 text-sm mb-4 leading-relaxed">Η ανταμοιβή σου <strong>"{showSuccess.name}"</strong> ξεκλειδώθηκε επιτυχώς.</p>
                        
                        <div className="bg-black/40 p-4 rounded-2xl border border-emerald-500/20 mb-6">
                            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mb-1">Κωδικος Εξαργυρωσης</p>
                            <p className="text-2xl font-mono font-black text-emerald-400 tracking-widest">{showSuccess.code}</p>
                        </div>

                        <button onClick={() => setShowSuccess(null)} className="w-full py-3 rounded-xl bg-emerald-600/90 backdrop-blur-md border border-emerald-500/50 text-white font-bold text-sm hover:bg-emerald-500 transition shadow-[0_0_20px_rgba(16,185,129,0.4)]">Υπέροχα!</button>
                    </div>
                </div>
            )}
        </div>
    );
}

function Soundscapes() {
    const sounds = [
        { id: 'rain', name: 'Βροχή', icon: <CloudRain className="w-10 h-10" />, url: '/sounds/rain.mp3', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
        { id: 'forest', name: 'Δάσος', icon: <TreePine className="w-10 h-10" />, url: '/sounds/forest.mp3', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
        { id: 'white', name: 'White Noise', icon: <Headphones className="w-10 h-10" />, url: '/sounds/white.mp3', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
    ];

    const [playing, setPlaying] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const toggleSound = (sound: typeof sounds[0]) => {
        if (playing === sound.id) {
            if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
            setPlaying(null);
        } else {
            if (audioRef.current) audioRef.current.pause();
            const audio = new Audio(sound.url);
            audio.loop = true; audio.volume = 0;
            audioRef.current = audio; setPlaying(sound.id);
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    let vol = 0;
                    const fadeInterval = setInterval(() => {
                        if (vol < 1) { vol += 0.05; audio.volume = Math.min(vol, 1); } 
                        else clearInterval(fadeInterval);
                    }, 50);
                }).catch(() => setPlaying(null));
            }
        }
    };

    useEffect(() => { return () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; } }; }, []);

    return (
        <div className="flex flex-col gap-6 w-full max-w-sm mx-auto animate-fade-in pt-4 px-2 pb-8">
            <div className="text-center mb-2 shrink-0">
                <h3 className="text-white font-bold text-2xl mb-1">Επίλεξε Ήχο</h3>
                <p className="text-slate-400 text-sm">Κλείσε τα μάτια. Άκουσε και χαλάρωσε.</p>
            </div>
            {sounds.map(sound => (
                <button
                    key={sound.id} onClick={() => toggleSound(sound)}
                    className={`flex items-center justify-between p-6 rounded-[2rem] border transition-all duration-300 active:scale-95 backdrop-blur-md shadow-lg shrink-0
                        ${playing === sound.id ? `${sound.color} border-current shadow-[0_0_30px_rgba(0,0,0,0.3)] scale-105` : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                >
                    <div className="flex items-center gap-5"><span className="drop-shadow-lg">{sound.icon}</span><span className="font-bold text-lg text-white">{sound.name}</span></div>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-black/20 shadow-inner border border-white/5 relative">{playing === sound.id ? <Pause className="w-5 h-5"/> : <Play className="w-5 h-5 ml-1"/>}</div>
                </button>
            ))}
            {playing && <p className="text-center text-[10px] text-slate-400 animate-pulse mt-4 uppercase tracking-widest font-bold shrink-0">Παίζει τώρα...</p>}
        </div>
    );
}

function Helplines() {
  const lines = [
    { id: "1", name: "Γραμμή Παρέμβασης", phone: "1018", desc: "24ωρη γραμμή για την αυτοκτονία", color: "bg-red-500/10 border-red-500/30 text-red-400" },
    { id: "2", name: "ΕΚΚΑ", phone: "197", desc: "Συμβουλευτική & Ψυχολογική Στήριξη", color: "bg-blue-500/10 border-blue-500/30 text-blue-400" },
    { id: "3", name: "Ψυχοκοινωνική Υποστήριξη", phone: "10306", desc: "Για όλα τα θέματα ψυχικής υγείας", color: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" },
    { id: "4", name: "Χαμόγελο του Παιδιού", phone: "1056", desc: "Για παιδιά και εφήβους", color: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400" },
  ];
  const [selectedLine, setSelectedLine] = useState<any>(null);

  return (
    <div className="w-full max-w-sm mx-auto space-y-4 animate-fade-in pb-8 pt-2">
      <div className="text-center mb-6">
        <h3 className="text-white font-bold text-xl mb-1">Δεν είσαι μόνος.</h3>
        <p className="text-slate-400 text-sm">Αν χρειάζεσαι υποστήριξη, κάλεσε τώρα.</p>
      </div>
      <div className="space-y-4">
        {lines.map(line => (
          <button key={line.id} onClick={() => setSelectedLine(line)} className={`w-full flex items-center justify-between p-5 rounded-3xl border transition active:scale-95 backdrop-blur-md shadow-sm ${line.color} hover:opacity-80`}>
            <div className="flex flex-col text-left flex-1 min-w-0 mr-3"><span className="font-bold text-base truncate">{line.name}</span><span className="text-xs opacity-80 truncate mt-1">{line.desc}</span></div>
            <div className="bg-black/20 backdrop-blur-sm w-28 py-2.5 rounded-2xl font-mono font-bold text-base flex-shrink-0 flex justify-center items-center gap-2 border border-white/5 shadow-inner"><Phone className="w-4 h-4"/> <span>{line.phone}</span></div>
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-500 text-center mt-8 px-4 opacity-70">*Η εφαρμογή SafeShare δεν αντικαθιστά την επαγγελματική βοήθεια.</p>

      {selectedLine && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-lg animate-fade-in">
            <div className={`bg-slate-900/90 backdrop-blur-2xl border ${selectedLine.color.replace('bg-', 'border-').split(' ')[0]} p-8 rounded-[2.5rem] w-full max-w-xs shadow-2xl text-center transform scale-100 transition-all`}>
                <div className="w-20 h-20 rounded-full bg-black/40 flex items-center justify-center mb-5 mx-auto border border-white/10 shadow-inner"><Phone className="w-10 h-10 text-white"/></div>
                <h3 className="text-xl font-bold text-white mb-3 leading-tight">{selectedLine.name}</h3>
                <p className="text-slate-400 text-sm mb-8 leading-relaxed">{selectedLine.desc}</p>
                <div className="flex gap-3">
                    <button onClick={() => setSelectedLine(null)} className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 text-slate-300 font-bold text-sm hover:bg-white/10 transition backdrop-blur-sm">Άκυρο</button>
                    <a href={`tel:${selectedLine.phone}`} className="flex-1 py-4 rounded-2xl bg-emerald-600/90 backdrop-blur-md border border-emerald-500/50 text-white font-bold text-sm hover:bg-emerald-500 transition shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2"><span>Κλήση</span></a>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

function PopItGame({ userId, onModalStateChange, onGameOver }: { userId?: string, onModalStateChange: (isOpen: boolean) => void, onGameOver?: () => void }) {
  const [bubbles, setBubbles] = useState(Array(20).fill(false)); 
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0); 
  const [timeLeft, setTimeLeft] = useState(10);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTimeUp, setIsTimeUp] = useState(false); 
  const [showResultModal, setShowResultModal] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [highScore, setHighScore] = useState(0);

  useEffect(() => { if (userId) getHighScore(userId, 'popIt').then(setHighScore); }, [userId]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying && timeLeft > 0) { interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000); } 
    else if (timeLeft === 0 && isPlaying) {
        setIsPlaying(false); setIsTimeUp(true); 
        setTimeout(() => { handleGameOver(); }, 1500); 
    }
    return () => clearInterval(interval);
  }, [isPlaying, timeLeft]);

  const handleGameOver = async () => {
    setIsTimeUp(false);
    const finalScore = scoreRef.current; 
    const isNew = await saveHighScore(userId, 'popIt', finalScore);
    setIsNewRecord(isNew);
    if (isNew) setHighScore(finalScore);
    setShowResultModal(true);
    onModalStateChange(true); 
    if (onGameOver) onGameOver();
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]); 
  };

  const startGame = () => {
    setScore(0); scoreRef.current = 0; setTimeLeft(10); setBubbles(Array(20).fill(false)); 
    setIsPlaying(true); setIsTimeUp(false); setShowResultModal(false); onModalStateChange(false); 
  };

  const handlePop = (index: number) => {
    if (!isPlaying || bubbles[index] || timeLeft <= 0 || isTimeUp) return; 
    new Audio(popSoundUrl).play().catch(() => {});
    const newBubbles = [...bubbles]; newBubbles[index] = true; setBubbles(newBubbles);
    const newScore = score + 1; setScore(newScore); scoreRef.current = newScore; 
    setTimeout(() => { setBubbles(prev => { const b = [...prev]; b[index] = false; return b; }); }, 400);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full animate-fade-in py-2 gap-4 relative pb-10">
      <div className="flex gap-4 w-full px-6 justify-between items-end">
         <div className="text-left bg-white/5 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10"><p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">High Score</p><p className="text-lg font-mono text-purple-400 font-bold">{highScore}</p></div>
         <div className="text-right"><p className="text-3xl font-mono font-black text-white drop-shadow-md">{timeLeft}s</p></div>
      </div>
      <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white/10 relative mx-auto">
        {!isPlaying && !isTimeUp && !showResultModal && (
            <div className="absolute inset-0 z-20 bg-slate-950/70 backdrop-blur-md rounded-[2.5rem] flex items-center justify-center border border-white/5">
                <button onClick={startGame} className="bg-purple-600/90 backdrop-blur-md text-white px-6 py-3 rounded-2xl font-bold shadow-[0_0_30px_rgba(147,51,234,0.5)] border border-purple-400/50 hover:scale-105 transition animate-pulse text-base flex items-center gap-2"><Play className="w-5 h-5"/> START GAME</button>
            </div>
        )}
        {isTimeUp && (
            <div className="absolute inset-0 z-30 bg-slate-950/80 backdrop-blur-sm rounded-[2.5rem] flex items-center justify-center border border-white/10 animate-fade-in"><p className="text-2xl font-black drop-shadow-lg text-center leading-tight tracking-widest text-purple-400">ΤΕΛΟΣ<br/>ΧΡΟΝΟΥ!</p></div>
        )}
        <div className="grid grid-cols-4 gap-3 relative z-10">
          {bubbles.map((isPopped, index) => (
            <button key={index} onClick={() => handlePop(index)} className={`w-12 h-12 rounded-full transition-all duration-100 flex items-center justify-center shadow-lg ${isPopped ? "bg-black/40 shadow-inner scale-90 border border-white/5" : "bg-gradient-to-br from-purple-400 to-indigo-600 scale-100 border-b-4 border-indigo-900/80 active:border-b-0 active:translate-y-1"}`}>
              {!isPopped && <div className="w-4 h-4 bg-white/30 rounded-full absolute top-1 right-2 blur-[1px]"></div>}
            </button>
          ))}
        </div>
      </div>
      <p className="text-slate-400 text-xs text-center font-medium">{isPlaying || isTimeUp ? `Score: ${score}` : "Σκάσε όσες περισσότερες φούσκες μπορείς!"}</p>
      {showResultModal && <ResultModal title={isNewRecord ? "Νέο Ρεκόρ!" : "Χρόνος!"} score={scoreRef.current} icon={isNewRecord ? <Trophy className="w-8 h-8"/> : <Gamepad2 className="w-8 h-8"/>} theme="purple" onClose={() => { setShowResultModal(false); onModalStateChange(false); }} />}
    </div>
  );
}

function SpeedTapGame({ userId, onModalStateChange, onGameOver }: { userId?: string, onModalStateChange: (isOpen: boolean) => void, onGameOver?: () => void }) {
    const [score, setScore] = useState(0);
    const scoreRef = useRef(0); 
    const [timeLeft, setTimeLeft] = useState(10); 
    const [isPlaying, setIsPlaying] = useState(false);
    const [isTimeUp, setIsTimeUp] = useState(false); 
    const [showResultModal, setShowResultModal] = useState(false);
    const [isNewRecord, setIsNewRecord] = useState(false);
    const [highScore, setHighScore] = useState(0);

    useEffect(() => { if (userId) getHighScore(userId, 'speedTap').then(setHighScore); }, [userId]);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isPlaying && timeLeft > 0) { interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000); } 
        else if (timeLeft === 0 && isPlaying) { setIsPlaying(false); setIsTimeUp(true); setTimeout(() => { handleGameOver(); }, 1500); }
        return () => clearInterval(interval);
    }, [isPlaying, timeLeft]);

    const handleGameOver = async () => {
        setIsTimeUp(false);
        const finalScore = scoreRef.current;
        const isNew = await saveHighScore(userId, 'speedTap', finalScore);
        setIsNewRecord(isNew);
        if (isNew) setHighScore(finalScore);
        setShowResultModal(true);
        onModalStateChange(true); 
        if (onGameOver) onGameOver();
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]); 
    };

    const startGame = () => {
        setScore(0); scoreRef.current = 0; setTimeLeft(10); setIsPlaying(true); setIsTimeUp(false); setShowResultModal(false); onModalStateChange(false); 
    };

    const handleTap = () => {
        if (!isPlaying || timeLeft <= 0 || isTimeUp) return;
        const newScore = score + 1; setScore(newScore); scoreRef.current = newScore;
        if (navigator.vibrate) navigator.vibrate(20); 
    };

    return (
        <div className="flex flex-col items-center justify-center w-full h-full animate-fade-in gap-6 pb-10">
            <div className="bg-white/5 backdrop-blur-md px-6 py-2 rounded-2xl border border-white/10 shadow-sm"><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center mb-1">High Score</p><p className="text-xl font-mono text-yellow-400 font-bold text-center">{highScore}</p></div>
            <div className="relative">
                {isPlaying && <svg className="absolute top-0 left-0 w-full h-full -rotate-90 pointer-events-none transform scale-[1.10] opacity-60"><circle cx="50%" cy="50%" r="48%" fill="none" stroke="#3b82f6" strokeWidth="6" strokeDasharray="100" strokeDashoffset={100 - (timeLeft / 10) * 100} pathLength="100" className="transition-all duration-1000 ease-linear" /></svg>}
                {isTimeUp && <div className="absolute inset-0 z-30 bg-slate-950/80 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/10 animate-fade-in scale-[1.05]"><p className="text-xl font-black drop-shadow-lg text-center tracking-widest text-blue-400">ΤΕΛΟΣ<br/>ΧΡΟΝΟΥ!</p></div>}
                <button onClick={isPlaying ? handleTap : startGame} className={`w-56 h-56 rounded-full shadow-[0_0_50px_rgba(59,130,246,0.3)] border border-white/10 backdrop-blur-xl flex flex-col items-center justify-center transition-all active:scale-95 select-none relative z-10 ${isPlaying ? "bg-blue-600/80 border-blue-400/50 active:bg-blue-500/80" : "bg-white/5 hover:bg-white/10"}`}>
                    {!isPlaying && !isTimeUp ? <><Play className="w-12 h-12 drop-shadow-lg ml-2 text-blue-200" fill="currentColor" /><span className="text-xs font-bold mt-2 text-slate-300 tracking-widest">START</span></> : <><span className="text-6xl font-black text-white drop-shadow-xl">{score}</span><span className="text-[10px] font-bold text-blue-200 mt-1 uppercase tracking-widest">Taps</span></>}
                </button>
            </div>
            <div className="text-center h-10"><p className="text-xs text-slate-400 leading-relaxed">{isPlaying || isTimeUp ? <span className="text-2xl font-mono text-blue-400 font-black drop-shadow-md">{timeLeft}s</span> : <>Πάτα όσο πιο γρήγορα μπορείς<br/>σε 10 δευτερόλεπτα!</>}</p></div>
            {showResultModal && <ResultModal title={isNewRecord ? "Νέο Ρεκόρ!" : "Χρόνος!"} score={scoreRef.current} icon={isNewRecord ? <Trophy className="w-8 h-8"/> : <Zap className="w-8 h-8"/>} theme="blue" onClose={() => { setShowResultModal(false); onModalStateChange(false); }} />}
        </div>
    );
}

function ResultModal({ title, score, icon, theme, onClose }: any) {
  const styles: any = { purple: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30', btn: 'bg-purple-600/90 hover:bg-purple-500 border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.3)]', shadow: 'shadow-[0_0_30px_rgba(168,85,247,0.4)]' }, blue: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30', btn: 'bg-blue-600/90 hover:bg-blue-500 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]', shadow: 'shadow-[0_0_30px_rgba(59,130,246,0.4)]' } };
  const s = styles[theme] || styles.purple;
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-lg animate-fade-in">
        <div className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 p-6 rounded-[2rem] w-full max-w-[280px] max-h-[90vh] overflow-y-auto shadow-2xl text-center transform scale-100 transition-all">
            <div className={`w-16 h-16 rounded-full ${s.bg} flex items-center justify-center mb-4 mx-auto ${s.shadow} animate-bounce border ${s.border}`}>{icon}</div>
            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <div className="bg-black/20 rounded-2xl p-4 mb-5 border border-white/5 shadow-inner"><p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-1">Σκορ</p><p className={`text-4xl font-black ${s.text} drop-shadow-md`}>{score}</p></div>
            <button onClick={onClose} className={`w-full py-3 rounded-xl backdrop-blur-md text-white font-bold text-sm transition ${s.btn}`}>Κλείσιμο</button>
        </div>
    </div>
  );
}

function ZenGardenGame({ onDraw }: { onDraw?: () => void }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [brushSize, setBrushSize] = useState(12); 
    const drawSoundRef = useRef<HTMLAudioElement | null>(null);
    const sweepSoundRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        drawSoundRef.current = new Audio('/sounds/sand-draw.mp3'); drawSoundRef.current.loop = true; drawSoundRef.current.volume = 0.5;
        sweepSoundRef.current = new Audio('/sounds/sand-sweep.mp3'); sweepSoundRef.current.volume = 0.6;
        return () => { if (drawSoundRef.current) { drawSoundRef.current.pause(); drawSoundRef.current = null; } if (sweepSoundRef.current) { sweepSoundRef.current.pause(); sweepSoundRef.current = null; } };
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current; if (!canvas) return;
        const rect = canvas.getBoundingClientRect(); canvas.width = rect.width; canvas.height = rect.height;
        const ctx = canvas.getContext('2d'); if (ctx) { ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    }, []);

    const getTouchPos = (canvas: HTMLCanvasElement, e: React.TouchEvent | React.MouseEvent) => {
        const rect = canvas.getBoundingClientRect(); let clientX, clientY;
        if ('touches' in e) { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; } else { clientX = (e as React.MouseEvent).clientX; clientY = (e as React.MouseEvent).clientY; }
        return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const startDrawing = (e: React.TouchEvent | React.MouseEvent) => {
        setIsDrawing(true); draw(e);
        if (drawSoundRef.current && drawSoundRef.current.paused) drawSoundRef.current.play().catch(() => {});
    };

    const stopDrawing = () => {
        if(isDrawing && onDraw) onDraw(); 
        setIsDrawing(false);
        const ctx = canvasRef.current?.getContext('2d'); if (ctx) ctx.beginPath(); 
        if (drawSoundRef.current) { drawSoundRef.current.pause(); drawSoundRef.current.currentTime = 0; }
    };

    const draw = (e: React.TouchEvent | React.MouseEvent) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current; const ctx = canvas?.getContext('2d'); if (!canvas || !ctx) return;
        const { x, y } = getTouchPos(canvas, e);
        ctx.lineWidth = brushSize; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#64748b'; ctx.shadowBlur = 4; ctx.shadowColor = '#000000'; 
        ctx.lineTo(x, y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y);
    };

    const resetGarden = () => {
        const canvas = canvasRef.current; const ctx = canvas?.getContext('2d');
        if (sweepSoundRef.current) { sweepSoundRef.current.currentTime = 0; sweepSoundRef.current.play().catch(() => {}); }
        if (canvas && ctx) {
            ctx.fillStyle = '#0f172a'; ctx.shadowBlur = 0; ctx.globalAlpha = 0.1; 
            let i = 0; const clear = setInterval(() => { ctx.fillRect(0, 0, canvas.width, canvas.height); i++; if (i > 20) { clearInterval(clear); ctx.globalAlpha = 1; ctx.fillRect(0, 0, canvas.width, canvas.height); } }, 20);
            if (navigator.vibrate) navigator.vibrate(30);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center w-full h-full animate-fade-in gap-4 pt-2 pb-10">
            <div className="relative w-full max-w-xs h-64 rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-white/10 bg-slate-900/50 backdrop-blur-md touch-none">
                <canvas ref={canvasRef} className="w-full h-full cursor-crosshair touch-none opacity-80" onMouseDown={startDrawing} onMouseUp={stopDrawing} onMouseMove={draw} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchEnd={stopDrawing} onTouchMove={draw} />
                <div className="absolute top-4 left-4 w-12 h-10 bg-slate-700/80 backdrop-blur-sm rounded-[40%_60%_70%_30%/40%_50%_60%_50%] shadow-[inset_2px_2px_4px_rgba(255,255,255,0.1),_4px_4px_10px_rgba(0,0,0,0.5)] pointer-events-none rotate-12 border border-white/5"></div>
                <div className="absolute bottom-10 right-8 w-16 h-12 bg-slate-600/80 backdrop-blur-sm rounded-[30%_70%_70%_30%/30%_30%_70%_70%] shadow-[inset_2px_2px_4px_rgba(255,255,255,0.1),_4px_4px_10px_rgba(0,0,0,0.5)] pointer-events-none -rotate-6 border border-white/5"></div>
            </div>
            <div className="flex flex-col items-center w-full max-w-xs gap-3 bg-white/5 backdrop-blur-xl p-4 rounded-[2rem] border border-white/10 shadow-lg">
                <div className="w-full flex items-center gap-3 px-2"><span className="text-xs text-slate-400 font-medium">Λεπτό</span><input type="range" min="5" max="40" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} className="flex-1 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-stone-400" /><span className="text-xs text-slate-400 font-medium">Παχύ</span></div>
                <div className="flex items-center justify-between w-full px-2 pt-2 border-t border-white/5"><p className="text-slate-400 text-[10px] leading-tight w-2/3">Ζωγράφισε στην άμμο</p><button onClick={resetGarden} className="px-4 py-2 bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold hover:bg-white/20 transition active:scale-95 shadow-sm flex items-center gap-1"><RefreshCw className="w-3 h-3"/> Καθαρισμός</button></div>
            </div>
        </div>
    );
}