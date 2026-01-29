
import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, X, Loader2, Sparkles, Send, CreditCard } from 'lucide-react';
import { supabase } from '../supabase';
import { Transaction, TransactionType, PaymentMethod, PaymentCard } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

interface TransactionsViewProps {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  onRefresh: () => void;
}

const TransactionsView: React.FC<TransactionsViewProps> = ({ transactions, setTransactions, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savedCards, setSavedCards] = useState<PaymentCard[]>([]);
  
  const [formData, setFormData] = useState<Partial<Transaction>>({
    type: TransactionType.EXPENSE,
    amount: 0,
    category: '',
    payment_method: PaymentMethod.DEBIT,
    account: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    const { data } = await supabase.from('payment_cards').select('*');
    setSavedCards(data || []);
  };

  const handleAiProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;
    
    setAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analise a seguinte frase sobre uma transação financeira e extraia os dados estruturados: "${aiInput}"`,
        config: {
          responseMimeType: "application/json",
          systemInstruction: `Você é um assistente financeiro. Extraia: descrição, valor (número), tipo ('income' para ganhos ou 'expense' para gastos) e uma categoria sugerida. 
          Retorne APENAS um JSON no formato: {"description": string, "amount": number, "type": "income" | "expense", "category": string}`,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING },
              amount: { type: Type.NUMBER },
              type: { type: Type.STRING },
              category: { type: Type.STRING }
            },
            required: ["description", "amount", "type", "category"]
          }
        },
      });

      const result = JSON.parse(response.text || '{}');
      
      setFormData({
        ...formData,
        description: result.description,
        amount: result.amount,
        type: result.type === 'income' ? TransactionType.INCOME : TransactionType.EXPENSE,
        category: result.category,
        date: new Date().toISOString().split('T')[0]
      });
      
      setAiInput('');
      setShowForm(true);
    } catch (error) {
      console.error("Erro no processamento IA:", error);
      alert("Não consegui entender a transação.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.description) return;
    setLoading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const payload = {
        ...formData,
        user_id: userData.user.id
      };

      if (editingId) {
        const { error } = await supabase
          .from('transactions')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('transactions')
          .insert([payload]);
        if (error) throw error;
      }
      
      onRefresh();
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
      alert('Erro ao salvar no banco de dados.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (t: Transaction) => {
    setFormData(t);
    setEditingId(t.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Excluir esta transação?')) {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (!error) onRefresh();
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      type: TransactionType.EXPENSE,
      amount: 0,
      category: '',
      payment_method: PaymentMethod.DEBIT,
      account: '',
      date: new Date().toISOString().split('T')[0],
      description: ''
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-1 rounded-2xl shadow-lg shadow-blue-500/20">
        <form onSubmit={handleAiProcess} className="relative flex items-center bg-white rounded-xl overflow-hidden">
          <div className="pl-4 text-blue-600">
            <Sparkles className={`w-5 h-5 ${aiLoading ? 'animate-pulse text-amber-500' : ''}`} />
          </div>
          <input 
            type="text" 
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            disabled={aiLoading}
            placeholder="Entrada Inteligente: 'Uber 50 no Cartão Visa', 'Paguei 120 Internet'..."
            className="flex-1 px-4 py-4 text-sm font-medium outline-none placeholder:text-slate-400"
          />
          <button 
            type="submit"
            disabled={aiLoading || !aiInput.trim()}
            className="px-6 py-4 bg-slate-900 text-white font-bold text-xs uppercase tracking-widest hover:bg-black transition-colors disabled:bg-slate-200 disabled:text-slate-400 flex items-center gap-2"
          >
            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-3 h-3" /> Processar</>}
          </button>
        </form>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Buscar transações..." 
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
          />
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          Nova Transação
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-lg">{editingId ? 'Editar' : 'Nova'} Transação</h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Tipo</label>
                  <select 
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value as TransactionType})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500"
                  >
                    <option value={TransactionType.EXPENSE}>Despesa</option>
                    <option value={TransactionType.INCOME}>Receita</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Valor (R$)</label>
                  <input 
                    type="number" step="0.01" required
                    value={formData.amount}
                    onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 font-bold text-blue-600"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Descrição</label>
                <input 
                  type="text" required
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Categoria</label>
                  <input 
                    type="text" 
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Método</label>
                  <select 
                    value={formData.payment_method}
                    onChange={e => setFormData({...formData, payment_method: e.target.value as PaymentMethod})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500"
                  >
                    <option value={PaymentMethod.DEBIT}>Débito</option>
                    <option value={PaymentMethod.CREDIT}>Crédito</option>
                    <option value={PaymentMethod.CASH}>Dinheiro</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Origem / Cartão</label>
                  {savedCards.length > 0 ? (
                    <select 
                      value={formData.account}
                      onChange={e => setFormData({...formData, account: e.target.value})}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500"
                    >
                      <option value="">Selecionar Cartão</option>
                      {savedCards.map(c => <option key={c.id} value={c.card_name}>{c.card_name} (**** {c.last_four})</option>)}
                      <option value="Outro">Outro</option>
                    </select>
                  ) : (
                    <input 
                      type="text" 
                      value={formData.account}
                      onChange={e => setFormData({...formData, account: e.target.value})}
                      placeholder="Ex: Itaú, NuBank..."
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500"
                    />
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Data</label>
                  <input 
                    type="date" 
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={resetForm} className="flex-1 py-4 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-2xl">Cancelar</button>
                <button 
                  type="submit" disabled={loading}
                  className="flex-1 py-4 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left min-w-[800px]">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200">
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Conta</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoria</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-5 text-sm font-medium text-slate-500">{t.date}</td>
                <td className="px-6 py-5">
                  <p className="text-sm font-bold text-slate-900">{t.description}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{t.payment_method}</p>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-slate-100 rounded-lg"><CreditCard className="w-3.5 h-3.5 text-slate-400" /></div>
                    <span className="text-sm font-bold text-slate-600">{t.account || '---'}</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                    {t.category}
                  </span>
                </td>
                <td className={`px-6 py-5 text-sm font-black ${t.type === TransactionType.INCOME ? 'text-green-600' : 'text-slate-900'}`}>
                  {t.type === TransactionType.INCOME ? '+' : '-'}R$ {t.amount.toLocaleString('pt-BR')}
                </td>
                <td className="px-6 py-5 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(t)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(t.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center text-slate-400 italic text-sm">
                  Nenhuma transação encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionsView;
