'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Lock, User, Key, ArrowRight } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'bruno' | 'professor'>('bruno');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleBrunoLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '33542772') {
      localStorage.setItem('admin_auth', 'true');
      router.push('/admin');
    } else {
      setError('Senha incorreta para Bruno');
    }
  };

  const handleProfessorCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      router.push(`/viewer?code=${code}`);
    } else {
      setError('Por favor, insira um código');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#050505]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-neutral-950 p-10 rounded-3xl border border-cyan-900/30 shadow-[0_0_50px_rgba(6,182,212,0.05)]"
      >
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
             <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-blue-600 rounded-xl blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative w-20 h-12 bg-black rounded-lg border border-cyan-500/50 flex items-center justify-center">
                   <span className="text-2xl font-black italic tracking-tighter text-white neon-text">BAK</span>
                </div>
             </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tighter text-white mb-2 uppercase">Portal <span className="text-cyan-400">BAK</span></h1>
          <p className="text-slate-500 text-xs uppercase tracking-[0.2em] font-semibold">Protocolo de Acesso Seguro</p>
        </div>

        <div className="flex mb-10 bg-black border border-neutral-800 p-1.5 rounded-2xl">
          <button 
            onClick={() => { setActiveTab('bruno'); setError(''); }}
            className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all font-semibold text-sm ${
              activeTab === 'bruno' ? 'bg-neutral-900 text-cyan-400 shadow-lg' : 'text-slate-600 hover:text-slate-400'
            }`}
          >
            <User size={16} />
            <span>Admin</span>
          </button>
          <button 
            onClick={() => { setActiveTab('professor'); setError(''); }}
            className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all font-semibold text-sm ${
              activeTab === 'professor' ? 'bg-neutral-900 text-cyan-400 shadow-lg' : 'text-slate-600 hover:text-slate-400'
            }`}
          >
            <Key size={16} />
            <span>Professor</span>
          </button>
        </div>

        {activeTab === 'bruno' ? (
          <form onSubmit={handleBrunoLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold ml-1">Senha Mestra</label>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-cyan-600 flex-shrink-0">
                  <Lock size={18} />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full neon-input"
                  placeholder="••••••••"
                />
              </div>
            </div>
            {error && <p className="text-red-400 text-[10px] uppercase font-bold italic ml-1 tracking-wider">{error}</p>}
            <button type="submit" className="w-full neon-button h-12">
               Autenticar Acesso
            </button>
          </form>
        ) : (
          <form onSubmit={handleProfessorCode} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold ml-1">Código de Acesso</label>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-cyan-600 flex-shrink-0">
                  <Key size={18} />
                </div>
                <input 
                  type="text" 
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full neon-input uppercase tracking-widest font-mono"
                  placeholder="DIGITE O CÓDIGO"
                />
              </div>
            </div>
            {error && <p className="text-red-400 text-[10px] uppercase font-bold italic ml-1 tracking-wider">{error}</p>}
            <button type="submit" className="w-full neon-button h-12">
               Verificar Credenciais
            </button>
          </form>
        )}

        <div className="mt-10 pt-8 border-t border-neutral-900 text-center">
          <div className="flex justify-center gap-4 text-[10px] text-slate-700 uppercase tracking-widest font-bold">
             <span>Sessão Criptografada</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
