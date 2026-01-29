
import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Bell, Shield, Palette, Save, CheckCircle2, 
  CreditCard, Plus, Trash2, Camera, Loader2, CreditCard as CardIcon,
  Upload, X
} from 'lucide-react';
import { supabase } from '../supabase';
import { PaymentCard } from '../types';

interface SettingsViewProps {
  user: any;
  onRefresh: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ user, onRefresh }) => {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState<PaymentCard[]>([]);
  const [cardLoading, setCardLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Profile State
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || '');

  // New Card State
  const [showCardForm, setShowCardForm] = useState(false);
  const [newCard, setNewCard] = useState<Partial<PaymentCard>>({
    card_name: '',
    card_brand: 'Visa',
    last_four: '',
    color: 'blue'
  });

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    setCardLoading(true);
    const { data } = await supabase.from('payment_cards').select('*');
    setCards(data || []);
    setCardLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("A imagem deve ter no máximo 2MB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      data: { 
        full_name: fullName,
        avatar_url: avatarUrl
      }
    });

    if (error) alert(error.message);
    else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      onRefresh();
    }
    setLoading(false);
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('payment_cards').insert([{
      ...newCard,
      user_id: user.id
    }]);

    if (error) alert(error.message);
    else {
      setShowCardForm(false);
      setNewCard({ card_name: '', card_brand: 'Visa', last_four: '', color: 'blue' });
      fetchCards();
    }
    setLoading(false);
  };

  const handleDeleteCard = async (id: string) => {
    if (!confirm('Excluir este cartão?')) return;
    await supabase.from('payment_cards').delete().eq('id', id);
    fetchCards();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
      {/* Profile Section */}
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center gap-8">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="w-32 h-32 rounded-[40px] bg-blue-600 flex items-center justify-center border-4 border-white shadow-xl overflow-hidden transition-transform group-hover:scale-105">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-black text-white uppercase">{fullName?.substring(0, 2) || 'FA'}</span>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 p-3 bg-blue-600 rounded-2xl shadow-lg border-2 border-white text-white">
              <Upload className="w-4 h-4" />
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
            />
          </div>
          
          <div className="text-center sm:text-left flex-1">
            <h3 className="text-2xl font-extrabold text-slate-900 mb-1">{fullName || 'Seu Nome'}</h3>
            <p className="text-slate-500 font-medium mb-4">{user?.email}</p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-widest rounded-full">
                <Shield className="w-3 h-3" /> Conta Verificada
              </span>
              {avatarUrl && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setAvatarUrl(''); }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <X className="w-3 h-3" /> Remover Foto
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button 
              onClick={handleUpdateProfile}
              disabled={loading}
              className={`flex items-center gap-2 px-10 py-4 rounded-2xl font-bold text-sm transition-all shadow-lg ${saved ? 'bg-green-600 text-white shadow-green-500/20' : 'bg-slate-900 text-white shadow-slate-900/20 hover:bg-black hover:-translate-y-0.5'}`}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : saved ? (
                <><CheckCircle2 className="w-4 h-4" /> Configurações Salvas</>
              ) : (
                <><Save className="w-4 h-4" /> Atualizar Perfil</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Cards Management Section (Sem alterações nesta parte) */}
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900">Meus Cartões e Contas</h4>
              <p className="text-xs text-slate-500 font-medium">Gestão de ativos financeiros</p>
            </div>
          </div>
          <button 
            onClick={() => setShowCardForm(true)}
            className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Adicionar
          </button>
        </div>

        {cardLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-slate-200" /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map(card => (
              <div 
                key={card.id} 
                className={`p-6 rounded-[28px] text-white relative overflow-hidden group hover:scale-[1.02] transition-all shadow-lg
                  ${card.color === 'blue' ? 'bg-gradient-to-br from-blue-600 to-blue-800' : 
                    card.color === 'purple' ? 'bg-gradient-to-br from-indigo-600 to-purple-800' :
                    card.color === 'orange' ? 'bg-gradient-to-br from-orange-500 to-red-600' :
                    'bg-gradient-to-br from-slate-700 to-slate-900'}
                `}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform"></div>
                
                <div className="flex justify-between items-start mb-10">
                  <CardIcon className="w-8 h-8 opacity-60" />
                  <button onClick={() => handleDeleteCard(card.id)} className="p-1.5 hover:bg-black/20 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{card.card_brand}</p>
                  <h5 className="font-bold text-lg mb-4">{card.card_name}</h5>
                  <div className="flex items-center gap-1.5">
                    <div className="flex gap-0.5">
                      <div className="w-1 h-1 bg-white/40 rounded-full"></div>
                      <div className="w-1 h-1 bg-white/40 rounded-full"></div>
                      <div className="w-1 h-1 bg-white/40 rounded-full"></div>
                      <div className="w-1 h-1 bg-white/40 rounded-full"></div>
                    </div>
                    <span className="text-sm font-bold opacity-80">{card.last_four || '****'}</span>
                  </div>
                </div>
              </div>
            ))}
            {cards.length === 0 && (
              <div className="col-span-full py-12 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center text-slate-300">
                <CardIcon className="w-10 h-10 mb-2 opacity-20" />
                <p className="text-sm font-medium">Nenhum cartão cadastrado ainda.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card Creation Modal */}
      {showCardForm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <CardIcon className="w-5 h-5 text-indigo-600" />
                Novo Cartão ou Conta
              </h3>
              <button onClick={() => setShowCardForm(false)} className="text-slate-400 hover:text-slate-600">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddCard} className="p-8 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nome do Cartão (Ex: NuBank, Salário, Itau)</label>
                <input 
                  type="text" required
                  value={newCard.card_name}
                  onChange={e => setNewCard({...newCard, card_name: e.target.value})}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Bandeira/Tipo</label>
                  <select 
                    value={newCard.card_brand}
                    onChange={e => setNewCard({...newCard, card_brand: e.target.value})}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/10"
                  >
                    <option>Mastercard</option>
                    <option>Visa</option>
                    <option>Elo</option>
                    <option>Amex</option>
                    <option>Conta Corrente</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Últimos 4 Dígitos</label>
                  <input 
                    type="text" maxLength={4}
                    value={newCard.last_four}
                    onChange={e => setNewCard({...newCard, last_four: e.target.value})}
                    placeholder="1234"
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Cor do Cartão</label>
                <div className="flex gap-3">
                  {['blue', 'purple', 'orange', 'slate'].map(c => (
                    <button 
                      key={c}
                      type="button"
                      onClick={() => setNewCard({...newCard, color: c})}
                      className={`w-10 h-10 rounded-xl border-4 transition-all ${newCard.color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-50'} 
                        ${c === 'blue' ? 'bg-blue-600' : c === 'purple' ? 'bg-indigo-600' : c === 'orange' ? 'bg-orange-500' : 'bg-slate-700'}`}
                    />
                  ))}
                </div>
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar Cadastro'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;
