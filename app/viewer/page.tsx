'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion } from 'motion/react';
import { ExternalLink, ShieldAlert, Folder, ArrowLeft } from 'lucide-react';

interface Subject {
  id: string;
  name: string;
  viewer_url: string;
}

function ViewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get('code');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [codeId, setCodeId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(60);

  useEffect(() => {
    if (codeId && !loading && !error) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            router.push('/');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [codeId, loading, error, router]);

  const validateCode = useCallback(async () => {
    try {
      // 1. Check code validity
      const { data: codeData, error: codeError } = await supabase
        .from('access_codes')
        .select('*')
        .eq('code', code?.toUpperCase())
        .single();

      if (codeError || !codeData) {
        setError('Código inválido ou expirado.');
        setLoading(false);
        return;
      }

      // 2. Check limits and expiration
      const now = new Date();
      const expirationDate = new Date(codeData.expires_at);

      if (now > expirationDate) {
        setError('Este código expirou.');
        setLoading(false);
        return;
      }

      if (codeData.usage_count >= codeData.usage_limit) {
        setError('Este código atingiu o limite de usos permitido.');
        setLoading(false);
        return;
      }

      // 3. Validated! Fetch subjects
      let query = supabase.from('subjects').select('id, name, viewer_url');
      
      if (codeData.subject_id) {
        query = query.eq('id', codeData.subject_id);
      }

      const { data: subjectsData } = await query.order('name');

      setCodeId(codeData.id);
      setSubjects(subjectsData || []);
      
      // Increment usage count once per successful validation
      await supabase
        .from('access_codes')
        .update({ usage_count: codeData.usage_count + 1 })
        .eq('id', codeData.id);

    } catch (err) {
      setError('Ocorreu um erro ao validar seu acesso.');
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    if (!code) {
      setError('Código ausente. Por favor, retorne à página inicial.');
      setLoading(false);
      return;
    }
    validateCode();
  }, [code, validateCode]);

  const logAndOpen = async (subject: Subject) => {
    // Log the specific folder access
    if (codeId) {
      await supabase.from('access_logs').insert([{
        code_id: codeId,
        subject_id: subject.id,
        user_agent: window.navigator.userAgent
      }]);
    }

    // Open the drive link
    window.open(subject.viewer_url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-mono text-sm uppercase tracking-widest">Validando Credenciais...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-zinc-950 border border-red-500/30 p-8 rounded-2xl text-center shadow-[0_0_20px_rgba(239,68,68,0.1)]"
        >
          <ShieldAlert className="text-red-500 mx-auto mb-4" size={48} />
          <h2 className="text-2xl font-bold text-white mb-2">Acesso Negado</h2>
          <p className="text-zinc-400 mb-6">{error}</p>
          <button 
            onClick={() => router.push('/')}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition-all"
          >
            <ArrowLeft size={18} /> VOLTAR AO INÍCIO
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-slate-300 p-6 md:p-12 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
               <div className="w-10 h-7 bg-black border border-cyan-500/50 rounded flex items-center justify-center">
                  <span className="text-sm font-black italic text-cyan-400 tracking-tighter">BAK</span>
               </div>
               <span className="text-cyan-500 text-[10px] uppercase font-mono font-bold tracking-[0.2em]">Protocolo: Autorizado</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tighter text-white uppercase">Módulos de <span className="text-cyan-400">Ensino</span></h1>
            <p className="text-slate-500 mt-2 text-sm max-w-md">Selecione o canal de conteúdo para abrir os diretórios do Google Drive.</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
               <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mb-1">Sessão Expira em</div>
               <div className={`text-2xl font-mono font-bold tabular-nums ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`}>
                  00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
               </div>
            </div>
            
            <button 
              onClick={() => router.push('/')}
              className="text-slate-500 hover:text-cyan-400 transition-colors flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-bold bg-neutral-950 border border-neutral-900 px-4 py-2 rounded-lg"
            >
              <ArrowLeft size={16} /> Encerrar Sessão
            </button>
          </div>
        </header>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {subjects.map((s, index) => (
            <motion.button
              key={s.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => logAndOpen(s)}
              className="group relative bg-neutral-950 border border-neutral-900 p-10 rounded-3xl text-left hover:border-cyan-500/50 transition-all shadow-2xl hover:shadow-cyan-500/5 overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                <ExternalLink className="text-cyan-400" size={20} />
              </div>
              
              <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center mb-8 text-neutral-700 group-hover:text-cyan-400 group-hover:bg-cyan-950/20 transition-all border border-neutral-900 group-hover:border-cyan-500/30">
                <Folder size={28} />
              </div>
              
              <h3 className="text-2xl font-bold mb-2 text-white group-hover:text-cyan-400 transition-colors tracking-tight">{s.name}</h3>
              <p className="text-slate-600 text-xs uppercase tracking-widest font-bold">Acessar Pasta</p>
              
              <div className="mt-8 pt-8 border-t border-neutral-900 flex items-center justify-between">
                 <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_5px_rgba(6,182,212,0.8)]"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-neutral-800"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-neutral-800"></div>
                 </div>
                 <span className="text-[10px] font-bold text-neutral-700 uppercase tracking-widest">Link Ativo</span>
              </div>
            </motion.button>
          ))}

          {subjects.length === 0 && (
            <div className="col-span-full py-24 text-center border-2 border-dashed border-neutral-900 rounded-[3rem]">
              <Folder className="text-neutral-800 mx-auto mb-6" size={64} />
              <p className="text-slate-600 uppercase tracking-widest font-bold text-sm">Nenhum módulo encontrado no servidor.</p>
            </div>
          )}
        </div>

        <footer className="mt-24 pt-10 border-t border-neutral-950 text-center">
          <div className="flex justify-center items-center gap-6">
             <span className="text-[10px] text-neutral-800 uppercase tracking-[0.3em] font-bold">Criptografia Ponta-a-Ponta</span>
             <div className="w-1 h-1 rounded-full bg-neutral-900"></div>
             <span className="text-[10px] text-neutral-800 uppercase tracking-[0.3em] font-bold">ID da Sessão: {codeId?.slice(0, 8)}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function ViewerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
      </div>
    }>
      <ViewContent />
    </Suspense>
  );
}
