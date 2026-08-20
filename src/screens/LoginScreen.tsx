import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen() {
  const { login, signup } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      isLogin ? await login(email, pass) : await signup(email, pass);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    // ✅ Premium Gradient Background 
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900/90 to-emerald-950/20 px-6 relative overflow-hidden">
      
      <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 drop-shadow-sm mb-2">
        <span className="text-white">Safe</span>Share
      </h1>
      <p className="text-slate-400 text-sm mb-10 font-medium tracking-wide">
        Κοινότητα υποστήριξης
      </p>
      
      {/* ✅ Glassmorphism Form Container */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5 bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
        
        {/* Glass Inputs */}
        <input 
          className="w-full p-4 rounded-2xl bg-black/20 border border-white/10 text-white outline-none focus:border-emerald-500/50 shadow-inner backdrop-blur-sm transition-all placeholder:text-slate-500 font-medium" 
          placeholder="Email" 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
        />
        
        <input 
          className="w-full p-4 rounded-2xl bg-black/20 border border-white/10 text-white outline-none focus:border-emerald-500/50 shadow-inner backdrop-blur-sm transition-all placeholder:text-slate-500 font-medium" 
          type="password" 
          placeholder="Password" 
          value={pass} 
          onChange={e => setPass(e.target.value)} 
        />
        
        {/* Error Message with Glassy Red look */}
        {error && (
          <p className="text-red-400 text-xs font-bold bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-center">
            {error}
          </p>
        )}
        
        {/* Premium Action Button */}
        <button className="w-full py-4 mt-2 rounded-2xl bg-emerald-600/90 backdrop-blur-md border border-emerald-500/50 text-white font-bold text-base hover:bg-emerald-500 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-[0.98]">
          {isLogin ? "Είσοδος" : "Εγγραφή"}
        </button>

      </form>
      
      {/* Toggle Button */}
      <button 
        onClick={() => setIsLogin(!isLogin)} 
        className="mt-8 text-slate-400 text-sm font-bold hover:text-emerald-400 transition-colors px-4 py-2 rounded-full hover:bg-white/5"
      >
        {isLogin ? "Δεν έχεις λογαριασμό; Φτιάξε εδώ." : "Έχεις λογαριασμό; Συνδέσου."}
      </button>
      
    </div>
  );
}