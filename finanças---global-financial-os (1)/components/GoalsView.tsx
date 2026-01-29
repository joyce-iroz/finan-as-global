
import React, { useState } from 'react';
import { Target, Calendar, Plus, X, Loader2, UserPlus, Share2, Trash2, Mail, RefreshCw, AlertCircle, Edit3, CheckCircle, ArrowRight } from 'lucide-react';
import { supabase } from '../supabase';
import { SavingsGoal } from '../types';

interface GoalsViewProps {
  goals: SavingsGoal[];
  setGoals: React.Dispatch<React.SetStateAction<SavingsGoal[]>>;
  onRefresh: () => void;
  currentUser: any;
  isRefreshing?: boolean;
}

const GoalsView: React.FC<GoalsViewProps> = ({ goals, setGoals, onRefresh, currentUser, isRefreshing }) => {
  const [showForm, setShowForm] = useState(false);
  const [showShareModal, setShowShareModal] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<SavingsGoal>>({
    name: '',
    target_amount: 0,
    current_amount: 0,
    deadline: new Date().toISOString().split('T')[0]
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.target_amount) return;
    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        target_amount: Number(formData.target_amount),
        current_amount: Number(formData.current_amount || 0),
        deadline: formData.deadline,
        // Mantemos o user_id original se estivermos editando, para não mudar a propriedade da meta
      };

      if (editingId) {
        const { error } = await supabase
          .from('savings_goals')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('savings_goals')
          .insert([{ ...payload, user_id: currentUser.id }]);
        if (error) throw error;
      }
      
      onRefresh();
      resetForm();
    } catch (error: any) {
      console.error('Erro ao salvar meta:', error);
      alert(`Erro: ${error.message || 'Falha ao salvar a meta.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta meta? Apenas o dono pode realizar esta ação.')) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('savings_goals').delete().eq('id', id);
      if (error) throw error;
      onRefresh();
    } catch (error: any) {
      alert(`Erro ao excluir: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (goal: SavingsGoal) => {
    setFormData({
      name: goal.name,
      target_amount: goal.target_amount,
      current_amount: goal.current_amount,
      deadline: goal.deadline
    });
    setEditingId(goal.id);
    setShowForm(true);
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareEmail || !showShareModal) return;
    setLoading(true);

    try {
      const emailTarget = shareEmail.toLowerCase().trim();
      
      if (emailTarget === currentUser.email.toLowerCase()) {
        alert("Você já é o dono desta meta.");
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('goal_shares')
        .insert([{
          goal_id: showShareModal,
          owner_id: currentUser.id,
          shared_with_email: emailTarget
        }]);

      if (error) {
        if (error.code === '23505') alert('Este usuário já foi convidado.');
        else throw error;
      } else {
        alert(`Meta compartilhada com ${emailTarget}!`);
        onRefresh();
        setShareEmail('');
      }
    } catch (error: any) {
      console.error('Erro ao compartilhar:', error);
      alert(`Erro ao compartilhar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      name: '',
      target_amount: 0,
      current_amount: 0,
      deadline: new Date().toISOString().split('T')[0]
    });
  };

  const selectedGoalForShare = goals.find(g => g.id === showShareModal);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Suas Metas</h2>
          <p className="text-sm text-slate-500">Acompanhe seu progresso e economize de forma colaborativa.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={() => onRefresh()}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Sincronizar
          </button>
          <button 
            onClick={() => setShowForm(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            Nova Meta
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal) => {
          const progress = Math.min(100, (goal.current_amount / goal.target_amount) * 100);
          const isOwner = goal.user_id === currentUser.id;
          const isGuest = goal.goal_shares?.some(s => s.shared_with_email.toLowerCase() === currentUser.email.toLowerCase());
          const canEdit = isOwner || isGuest;
          
          return (
            <div key={goal.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all flex flex-col group animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-start mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${isOwner ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'}`}>
                  <Target className="w-6 h-6" />
                </div>
                <div className="flex gap-1">
                  {canEdit && (
                    <button onClick={() => handleEdit(goal)} title="Editar" className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                  {isOwner && (
                    <>
                      <button onClick={() => setShowShareModal(goal.id)} title="Compartilhar" className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(goal.id)} title="Excluir" className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-lg font-bold text-slate-900 truncate flex-1">{goal.name}</h4>
                  {isGuest && <span className="text-[9px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter">Editor</span>}
                </div>
                <p className="text-sm text-slate-500 font-medium">Meta: R$ {goal.target_amount.toLocaleString('pt-BR')}</p>
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-2xl font-black text-slate-900">{progress.toFixed(0)}<span className="text-xs text-slate-400 ml-0.5">%</span></span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Concluído</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${progress >= 100 ? 'bg-green-500' : 'bg-blue-600'}`} 
                      style={{ width: `${progress}%` }} 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5 tracking-tighter">Guardado</p>
                    <p className="text-sm font-bold text-slate-900 leading-none">R$ {goal.current_amount.toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5 tracking-tighter">Restante</p>
                    <p className="text-sm font-bold text-slate-900 leading-none">R$ {Math.max(0, goal.target_amount - goal.current_amount).toLocaleString('pt-BR')}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{goal.deadline}</span>
                </div>
                <div className="flex -space-x-1.5">
                  <div className="w-6 h-6 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-[7px] text-white font-black" title="Dono">YOU</div>
                  {goal.goal_shares?.map((share, i) => (
                    <div key={i} className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[8px] text-slate-600 font-bold uppercase" title={share.shared_with_email}>
                      {share.shared_with_email.charAt(0)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}

        <button 
          onClick={() => setShowForm(true)}
          className="border-2 border-dashed border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all min-h-[300px]"
        >
          <div className="w-12 h-12 rounded-2xl border-2 border-current flex items-center justify-center mb-4">
            <Plus className="w-6 h-6" />
          </div>
          <p className="font-bold text-sm">Novo Objetivo Financeiro</p>
          <p className="text-xs mt-1 text-center text-slate-400 max-w-[150px]">Clique aqui para começar a economizar</p>
        </button>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                {editingId ? 'Editar Meta' : 'Novo Objetivo'}
              </h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Título da Meta</label>
                <input 
                  type="text" required placeholder="Ex: Intercâmbio, Carro Novo..."
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Meta (R$)</label>
                  <input 
                    type="number" required step="0.01"
                    value={formData.target_amount || ''}
                    onChange={e => setFormData({...formData, target_amount: parseFloat(e.target.value)})}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-slate-900"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Já Guardado (R$)</label>
                  <input 
                    type="number" step="0.01"
                    value={formData.current_amount || ''}
                    onChange={e => setFormData({...formData, current_amount: parseFloat(e.target.value)})}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-blue-600 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Data Alvo</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="date" required
                    value={formData.deadline}
                    onChange={e => setFormData({...formData, deadline: e.target.value})}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={resetForm} className="flex-1 py-4 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-2xl transition-all">Cancelar</button>
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="flex-1 py-4 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : editingId ? 'Atualizar Meta' : 'Criar Meta'}
                  {!loading && <CheckCircle className="w-4 h-4" />}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-indigo-50/50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-indigo-600" />
                Compartilhar Meta
              </h3>
              <button onClick={() => setShowShareModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Pessoas com acesso</p>
                <div className="space-y-2">
                   <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-[8px] font-black text-white shadow-sm">YOU</div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{currentUser.email}</p>
                        <p className="text-[9px] text-blue-600 font-bold uppercase tracking-widest">Proprietário</p>
                      </div>
                    </div>
                  </div>
                  {selectedGoalForShare?.goal_shares?.map((share, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-100 group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 uppercase">
                          {share.shared_with_email.charAt(0)}
                        </div>
                        <p className="text-xs font-medium text-slate-600 truncate max-w-[150px]">{share.shared_with_email}</p>
                      </div>
                      <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase">Editor</span>
                    </div>
                  ))}
                </div>
              </div>

              <form onSubmit={handleShare} className="space-y-4 pt-4 border-t border-slate-100">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Convidar via E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="email" required placeholder="email@exemplo.com"
                      value={shareEmail}
                      onChange={e => setShareEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full py-4 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/20 transition-all active:scale-[0.98]">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><UserPlus className="w-4 h-4" /> Enviar Convite</>}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalsView;
