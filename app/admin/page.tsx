'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Trash2, Link as LinkIcon, Edit, 
  Settings, LogOut, Search, Clock, Users, Database, ExternalLink
} from 'lucide-react';

interface Subject {
  id: string;
  name: string;
  editor_url: string;
  viewer_url: string;
  created_at: string;
}

interface AccessCode {
  id: string;
  code: string;
  usage_limit: number;
  usage_count: number;
  expires_at: string;
  created_at: string;
  subject_id: string | null;
}

interface AccessLog {
  id: string;
  accessed_at: string;
  subject_id: string;
  code_id: string;
  user_agent: string;
  subjects: { name: string };
  access_codes: { code: string };
}

export default function AdminDashboard() {
  const [isAuth, setIsAuth] = useState(false);
  const [activeView, setActiveView] = useState<'subjects' | 'codes' | 'logs'>('subjects');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States for forms
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [newSubject, setNewSubject] = useState({ name: '', editor_url: '', viewer_url: '' });
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [newCode, setNewCode] = useState(() => ({ 
    code: '', 
    usage_limit: 5, 
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    subject_id: ''
  }));

  const router = useRouter();

  const fetchSubjects = useCallback(async () => {
    const { data } = await supabase.from('subjects').select('*').order('created_at', { ascending: false });
    if (data) setSubjects(data);
  }, []);

  const fetchCodes = useCallback(async () => {
    const { data } = await supabase.from('access_codes').select('*').order('created_at', { ascending: false });
    if (data) setCodes(data);
  }, []);

  const fetchLogs = useCallback(async () => {
    const { data } = await supabase
      .from('access_logs')
      .select(`
        *,
        subjects(name),
        access_codes(code)
      `)
      .order('accessed_at', { ascending: false });
    if (data) setLogs(data as any);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchSubjects(),
      fetchCodes(),
      fetchLogs()
    ]);
    setLoading(false);
  }, [fetchSubjects, fetchCodes, fetchLogs]);

  useEffect(() => {
    const auth = localStorage.getItem('admin_auth');
    if (auth !== 'true') {
      router.push('/');
    } else {
      setIsAuth(true);
      fetchData();
    }
  }, [router, fetchData]);

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('subjects').insert([newSubject]);
    if (!error) {
      setNewSubject({ name: '', editor_url: '', viewer_url: '' });
      setShowSubjectModal(false);
      fetchSubjects();
    }
  };

  const handleAddCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('access_codes').insert([{ 
      ...newCode, 
      code: newCode.code.toUpperCase(),
      subject_id: newCode.subject_id === '' ? null : newCode.subject_id
    }]);
    if (!error) {
      setNewCode({ 
        code: '', 
        usage_limit: 5, 
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        subject_id: ''
      });
      setShowCodeModal(false);
      fetchCodes();
    }
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewCode({ ...newCode, code: result });
  };

  const deleteSubject = async (id: string) => {
    if (confirm('Deseja excluir esta matéria?')) {
      await supabase.from('subjects').delete().eq('id', id);
      fetchSubjects();
    }
  };

  const deleteCode = async (id: string) => {
    if (confirm('Deseja excluir este código?')) {
      await supabase.from('access_codes').delete().eq('id', id);
      fetchCodes();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    router.push('/');
  };

  if (!isAuth) return null;

  return (
    <div className="min-h-screen bg-black text-slate-300 font-sans flex flex-col overflow-hidden">
      {/* Top Navigation */}
      <nav className="h-16 border-b border-cyan-900/30 bg-neutral-950 flex items-center justify-between px-8 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-7 bg-black border border-cyan-500/50 rounded flex items-center justify-center">
            <span className="text-sm font-black italic text-cyan-400 tracking-tighter">BAK</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-white uppercase">SISTEMA <span className="text-cyan-400">BAK</span></span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end mr-4 hidden md:flex">
            <span className="text-[10px] text-cyan-500 uppercase font-bold tracking-widest leading-none mb-1">Sessão de Admin</span>
            <span className="text-sm text-white font-medium">Bruno | Root</span>
          </div>
          <div className="w-10 h-10 rounded-full border border-cyan-500/30 p-1 bg-black">
            <div className="w-full h-full rounded-full bg-neutral-800 flex items-center justify-center text-xs text-white font-bold">B.</div>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-20 bg-neutral-950 border-r border-cyan-900/30 flex flex-col items-center py-8 gap-8">
          <button 
            onClick={() => setActiveView('subjects')}
            className={`admin-sidebar-btn ${activeView === 'subjects' ? 'active' : 'inactive'}`}
            title="Matérias"
          >
            <Database size={24} />
          </button>
          <button 
            onClick={() => setActiveView('codes')}
            className={`admin-sidebar-btn ${activeView === 'codes' ? 'active' : 'inactive'}`}
            title="Códigos"
          >
            <Settings size={24} />
          </button>
          <button 
            onClick={() => setActiveView('logs')}
            className={`admin-sidebar-btn ${activeView === 'logs' ? 'active' : 'inactive'}`}
            title="Histórico"
          >
            <Clock size={24} />
          </button>
          
          <button 
            onClick={handleLogout}
            className="mt-auto admin-sidebar-btn text-red-500/50 hover:text-red-400 hover:bg-red-500/10"
            title="Sair"
          >
            <LogOut size={24} />
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 grid grid-cols-12 gap-8 bg-[#050505] overflow-y-auto">
          {loading ? (
            <div className="col-span-12 flex items-center justify-center h-full">
               <div className="text-center">
                  <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-xs uppercase tracking-widest text-slate-600 font-bold">Sincronizando Dados...</p>
               </div>
            </div>
          ) : (
            <>
              {/* Left Column: List */}
              <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                 <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xs font-bold text-cyan-500 uppercase tracking-[0.2em]">Gerenciamento</h2>
                    <button 
                      onClick={() => activeView === 'subjects' ? setShowSubjectModal(true) : setShowCodeModal(true)} 
                      className="text-white bg-neutral-900 border border-neutral-800 p-2 rounded-lg hover:border-cyan-500 transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                 </div>
                 
                 <div className="space-y-3">
                    {activeView === 'subjects' && subjects.map(s => (
                       <div key={s.id} className="group p-4 bg-neutral-950 border border-neutral-800 hover:border-cyan-500/50 rounded-xl flex justify-between items-center transition-all cursor-pointer shadow-lg hover:shadow-cyan-500/5">
                          <div className="flex flex-col">
                             <span className="text-white font-medium group-hover:text-cyan-400 transition-colors">{s.name}</span>
                             <span className="text-[10px] text-zinc-600 uppercase font-bold tracking-tighter">Drive Ativo</span>
                          </div>
                          <div className="flex gap-2">
                             <button onClick={() => deleteSubject(s.id)} className="p-1.5 rounded-md hover:bg-red-500/10 text-slate-700 hover:text-red-500 transition-colors">
                                <Trash2 size={14} />
                             </button>
                          </div>
                       </div>
                    ))}

                    {activeView === 'codes' && codes.map(c => (
                       <div key={c.id} className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl flex justify-between items-center shadow-lg">
                          <div className="flex flex-col">
                             <span className="text-cyan-400 font-mono text-sm font-bold tracking-widest">{c.code}</span>
                             <span className="text-[10px] text-zinc-600 uppercase font-bold tracking-tighter">{c.usage_count}/{c.usage_limit} usos</span>
                          </div>
                          <button onClick={() => deleteCode(c.id)} className="p-1.5 rounded-md hover:bg-red-500/10 text-slate-700 hover:text-red-500 transition-colors">
                             <Trash2 size={14} />
                          </button>
                       </div>
                    ))}

                    {activeView === 'logs' && (
                       <div className="text-xs text-slate-500 p-4 border border-zinc-900 rounded-xl border-dashed text-center italic">
                          Clique nas entradas à direita para detalhes
                       </div>
                    )}
                 </div>
              </div>

              {/* Right Column: Content/Table */}
              <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
                 {activeView === 'subjects' && subjects[0] && (
                    <div className="card-elegant">
                       <h3 className="text-white font-semibold mb-6 flex items-center gap-2 border-b border-neutral-800 pb-4">
                          <Database className="text-cyan-500" size={18} />
                          Configuração da Matéria
                       </h3>
                       <div className="space-y-6">
                          {subjects.slice(0, 1).map(s => (
                             <div key={s.id} className="space-y-6">
                                <div>
                                  <label className="text-[10px] uppercase tracking-widest text-slate-600 block mb-2 font-bold">Drive URL (Editor - Bruno)</label>
                                  <div className="flex gap-2">
                                     <input type="text" value={s.editor_url} className="w-full neon-input text-cyan-100/70" readOnly />
                                     <a href={s.editor_url} target="_blank" className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-cyan-500 hover:bg-neutral-800 transition-colors">
                                        <ExternalLink size={18} />
                                     </a>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-[10px] uppercase tracking-widest text-slate-600 block mb-2 font-bold">Drive URL (Visualização - Professor)</label>
                                  <div className="flex gap-2">
                                     <input type="text" value={s.viewer_url} className="w-full neon-input text-cyan-100/70" readOnly />
                                     <a href={s.viewer_url} target="_blank" className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-cyan-500 hover:bg-neutral-800 transition-colors">
                                        <ExternalLink size={18} />
                                     </a>
                                  </div>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                 )}

                 {activeView === 'codes' && (
                    <div className="card-elegant h-full overflow-hidden flex flex-col">
                       <div className="flex justify-between items-center mb-6">
                          <h3 className="text-white font-semibold flex items-center gap-2">
                             <Settings className="text-cyan-500" size={18} />
                             Registro de Credenciais de Segurança
                          </h3>
                       </div>
                       <div className="overflow-x-auto flex-1">
                          <table className="w-full text-left text-xs">
                             <thead>
                                <tr className="text-slate-600 border-b border-neutral-800">
                                   <th className="pb-4 font-bold uppercase tracking-tighter">Chave de Autenticação</th>
                                   <th className="pb-4 font-bold uppercase tracking-tighter">Cota</th>
                                   <th className="pb-4 font-bold uppercase tracking-tighter">Validade</th>
                                   <th className="pb-4 font-bold uppercase tracking-tighter text-right">Ações</th>
                                </tr>
                             </thead>
                             <tbody className="text-slate-400">
                                {codes.map(c => (
                                   <tr key={c.id} className="border-b border-neutral-800/40 hover:bg-neutral-900/40 transition-colors">
                                      <td className="py-4 font-mono text-cyan-400 font-bold">{c.code}</td>
                                      <td className="py-4">{c.usage_count} / {c.usage_limit}</td>
                                      <td className="py-4">{new Date(c.expires_at).toLocaleDateString()}</td>
                                      <td className="py-4 text-right">
                                         <button onClick={() => deleteCode(c.id)} className="text-neutral-700 hover:text-red-500 transition-colors">
                                            <Trash2 size={16} />
                                         </button>
                                      </td>
                                   </tr>
                                ))}
                             </tbody>
                          </table>
                       </div>
                    </div>
                 )}

                 {activeView === 'logs' && (
                    <div className="card-elegant h-full flex flex-col">
                       <div className="flex justify-between items-center mb-6">
                          <h3 className="text-white font-semibold flex items-center gap-2">
                             <Clock className="text-cyan-500" size={18} />
                             Histórico de Acessos Recentes
                          </h3>
                          <span className="text-[10px] text-cyan-500 font-bold uppercase tracking-widest animate-pulse">Sincronização Ativa</span>
                       </div>
                       <div className="overflow-x-auto flex-1">
                          <table className="w-full text-left text-xs">
                             <thead>
                                <tr className="text-slate-600 border-b border-neutral-800">
                                   <th className="pb-4 font-bold uppercase tracking-tighter">Entidade/Canal</th>
                                   <th className="pb-4 font-bold uppercase tracking-tighter text-center">Protocolo</th>
                                   <th className="pb-4 font-bold uppercase tracking-tighter text-right">Data/Hora</th>
                                </tr>
                             </thead>
                             <tbody className="text-slate-400">
                                {logs.map(l => (
                                   <tr key={l.id} className="border-b border-neutral-800/40 hover:bg-neutral-900/40 transition-colors">
                                      <td className="py-4">
                                         <span className="text-white font-medium">{l.subjects?.name || 'Indefinido'}</span>
                                         <span className="block text-[10px] text-zinc-600 mt-1">Chave: {l.access_codes?.code || 'Mestra'}</span>
                                      </td>
                                      <td className="py-4 text-center">
                                         <span className="text-[10px] bg-cyan-950/40 border border-cyan-800 text-cyan-400 px-2 py-0.5 rounded font-bold uppercase">Autorizado</span>
                                      </td>
                                      <td className="py-4 text-right text-slate-500 tabular-nums">
                                         {new Date(l.accessed_at).toLocaleString()}
                                      </td>
                                   </tr>
                                ))}
                             </tbody>
                          </table>
                          {logs.length === 0 && <p className="text-center py-12 text-slate-700 italic">Nenhum dado de telemetria detectado.</p>}
                       </div>
                    </div>
                 )}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Modals - Simplified for Elegant Theme */}
      <AnimatePresence>
        {(showSubjectModal || showCodeModal) && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="bg-neutral-950 border border-cyan-900/30 p-10 rounded-3xl w-full max-w-lg shadow-[0_0_50px_rgba(6,182,212,0.1)]"
            >
              {showSubjectModal ? (
                 <>
                    <h2 className="text-2xl font-bold mb-6 text-white tracking-tighter uppercase">Novo <span className="text-cyan-400">Recurso</span></h2>
                    <form onSubmit={handleAddSubject} className="space-y-5">
                       <div className="space-y-2">
                         <label className="text-[10px] uppercase font-bold text-slate-600 tracking-widest pl-1">Nome</label>
                         <input required type="text" value={newSubject.name} onChange={e => setNewSubject({...newSubject, name: e.target.value})} className="w-full neon-input" placeholder="ex: Matemática" />
                       </div>
                       <div className="space-y-2">
                         <label className="text-[10px] uppercase font-bold text-slate-600 tracking-widest pl-1">URL Mestra (Editor)</label>
                         <input required type="url" value={newSubject.editor_url} onChange={e => setNewSubject({...newSubject, editor_url: e.target.value})} className="w-full neon-input" placeholder="https://drive.google.com/..." />
                       </div>
                       <div className="space-y-2">
                         <label className="text-[10px] uppercase font-bold text-slate-600 tracking-widest pl-1">URL do Túnel (Visualizador)</label>
                         <input required type="url" value={newSubject.viewer_url} onChange={e => setNewSubject({...newSubject, viewer_url: e.target.value})} className="w-full neon-input" placeholder="https://drive.google.com/..." />
                       </div>
                       <div className="flex gap-4 pt-6">
                         <button type="button" onClick={() => setShowSubjectModal(false)} className="flex-1 py-3 text-slate-600 hover:text-white transition-colors font-bold text-xs uppercase tracking-widest">Abortar</button>
                         <button type="submit" className="flex-1 neon-button">Implementar Recurso</button>
                       </div>
                    </form>
                 </>
              ) : (
                 <>
                    <h2 className="text-2xl font-bold mb-6 text-white tracking-tighter uppercase">Nova <span className="text-cyan-400">Credencial</span></h2>
                    <form onSubmit={handleAddCode} className="space-y-5">
                       <div className="space-y-2">
                         <div className="flex justify-between items-center pl-1">
                            <label className="text-[10px] uppercase font-bold text-slate-600 tracking-widest">Código de Acesso</label>
                            <button 
                              type="button" 
                              onClick={generateRandomCode}
                              className="text-[10px] text-cyan-500 hover:text-cyan-400 font-bold uppercase tracking-widest"
                            >
                              Gerar Aleatório
                            </button>
                         </div>
                         <input required type="text" value={newCode.code} onChange={e => setNewCode({...newCode, code: e.target.value.toUpperCase()})} className="w-full neon-input font-mono" placeholder="DIGITE OU GERE UM CÓDIGO" />
                       </div>
                       <div className="space-y-2">
                         <label className="text-[10px] uppercase font-bold text-slate-600 tracking-widest pl-1">Matéria Associada</label>
                         <select 
                           value={newCode.subject_id} 
                           onChange={e => setNewCode({...newCode, subject_id: e.target.value})}
                           className="w-full neon-input appearance-none"
                         >
                           <option value="">Todas as Matérias</option>
                           {subjects.map(s => (
                             <option key={s.id} value={s.id}>{s.name}</option>
                           ))}
                         </select>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] uppercase font-bold text-slate-600 tracking-widest pl-1">Cota de Acesso</label>
                            <input required type="number" value={newCode.usage_limit} onChange={e => setNewCode({...newCode, usage_limit: parseInt(e.target.value)})} className="w-full neon-input" min="1" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] uppercase font-bold text-slate-600 tracking-widest pl-1">Expiração (Data e Hora)</label>
                            <input required type="datetime-local" value={newCode.expires_at} onChange={e => setNewCode({...newCode, expires_at: e.target.value})} className="w-full neon-input" />
                          </div>
                       </div>
                       <div className="flex gap-4 pt-6">
                         <button type="button" onClick={() => setShowCodeModal(false)} className="flex-1 py-3 text-slate-600 hover:text-white transition-colors font-bold text-xs uppercase tracking-widest">Abortar</button>
                         <button type="submit" className="flex-1 neon-button">Gerar Credencial</button>
                       </div>
                    </form>
                 </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
