
import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, Plus, ExternalLink, X, Loader2, Info } from 'lucide-react';
import { supabase } from '../supabase';
import { Investment, AssetType } from '../types';

interface InvestmentsViewProps {
  investments: Investment[];
  setInvestments: React.Dispatch<React.SetStateAction<Investment[]>>;
  onRefresh: () => void;
}

const COLORS = ['#2563eb', '#7c3aed', '#db2777', '#f59e0b', '#10b981'];

const InvestmentsView: React.FC<InvestmentsViewProps> = ({ investments, setInvestments, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Investment | null>(null);
  const [formData, setFormData] = useState<Partial<Investment>>({
    asset_name: '',
    asset_type: AssetType.STOCK,
    amount_invested: 0,
    current_value: 0,
    date_invested: new Date().toISOString().split('T')[0]
  });

  const summary = useMemo(() => {
    const totalInvested = investments.reduce((acc, curr) => acc + curr.amount_invested, 0);
    const currentValue = investments.reduce((acc, curr) => acc + curr.current_value, 0);
    const profit = currentValue - totalInvested;
    const profitPct = totalInvested > 0 ? (profit / totalInvested) * 100 : 0;

    const allocation = investments.reduce((acc: any[], curr) => {
      const idx = acc.findIndex(a => a.name === curr.asset_type);
      if (idx > -1) acc[idx].value += curr.current_value;
      else acc.push({ name: curr.asset_type, value: curr.current_value });
      return acc;
    }, []);

    return { totalInvested, currentValue, profit, profitPct, allocation };
  }, [investments]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.asset_name || !formData.amount_invested) return;
    setLoading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { error } = await supabase
        .from('investments')
        .insert([{
          ...formData,
          user_id: userData.user.id
        }]);

      if (error) throw error;
      
      onRefresh();
      setShowForm(false);
      setFormData({
        asset_name: '',
        asset_type: AssetType.STOCK,
        amount_invested: 0,
        current_value: 0,
        date_invested: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Erro ao salvar investimento:', error);
      alert('Erro ao salvar no Supabase.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-slate-900 text-white p-8 rounded-2xl shadow-xl lg:col-span-2">
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">Valor Total do Portfólio</p>
              <h3 className="text-4xl font-bold">R$ {summary.currentValue.toLocaleString('pt-BR')}</h3>
            </div>
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${summary.profit >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              <TrendingUp className="w-4 h-4" />
              {summary.profitPct.toFixed(2)}%
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 border-t border-slate-800 pt-8">
            <div>
              <p className="text-slate-400 text-xs font-medium mb-1 uppercase tracking-wider">Total Investido</p>
              <p className="text-xl font-bold">R$ {summary.totalInvested.toLocaleString('pt-BR')}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-medium mb-1 uppercase tracking-wider">Lucro Líquido</p>
              <p className={`text-xl font-bold ${summary.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {summary.profit >= 0 ? '+' : '-'}R$ {Math.abs(summary.profit).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center">
          <h4 className="font-bold text-slate-900 w-full mb-4">Alocação</h4>
          <div className="flex-1 w-full min-h-[180px]">
            {summary.allocation.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={summary.allocation}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {summary.allocation.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-300 text-xs italic">Sem dados</div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 w-full mt-4">
            {summary.allocation.map((a, i) => (
              <div key={a.name} className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                {a.name.replace('_', ' ')}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Seus Ativos</h3>
          <button onClick={() => setShowForm(true)} className="text-sm font-bold text-blue-600 flex items-center gap-1 hover:underline">
            <Plus className="w-4 h-4" /> Adicionar Ativo
          </button>
        </div>
        <div className="divide-y divide-slate-100">
          {investments.map((inv) => {
            const invProfit = inv.current_value - inv.amount_invested;
            const invProfitPct = (invProfit / inv.amount_invested) * 100;
            return (
              <div key={inv.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-500">
                    {inv.asset_name.substring(0, 2)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{inv.asset_name}</h4>
                    <p className="text-xs text-slate-500 uppercase font-semibold">{inv.asset_type.replace('_', ' ')} • Desde {inv.date_invested}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-right">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Total Aplicado</p>
                    <p className="text-sm font-bold text-slate-900">R$ {inv.amount_invested.toLocaleString('pt-BR')}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Valor de Mercado</p>
                    <p className="text-sm font-bold text-slate-900">R$ {inv.current_value.toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="hidden md:block">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Lucro/Prejuízo</p>
                    <p className={`text-sm font-bold ${invProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {invProfit >= 0 ? '+' : '-'}R$ {Math.abs(invProfit).toLocaleString('pt-BR')} ({invProfitPct.toFixed(1)}%)
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                   <button 
                    onClick={() => setSelectedAsset(inv)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                   >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
          {investments.length === 0 && (
            <div className="p-12 text-center text-slate-400 text-sm italic">Portfólio vazio. Adicione seu primeiro ativo.</div>
          )}
        </div>
      </div>

      {/* Modal de Detalhes do Ativo */}
      {selectedAsset && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600" />
                Informações do Ativo
              </h3>
              <button onClick={() => setSelectedAsset(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 space-y-6 text-center">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto text-xl font-black">
                {selectedAsset.asset_name.substring(0, 2)}
              </div>
              <div>
                <h4 className="text-2xl font-bold text-slate-900">{selectedAsset.asset_name}</h4>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">{selectedAsset.asset_type.replace('_', ' ')}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-100">
                <div className="text-center">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Custo Médio</p>
                  <p className="font-bold text-slate-900">R$ {selectedAsset.amount_invested.toLocaleString('pt-BR')}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Cotação Atual</p>
                  <p className="font-bold text-blue-600">R$ {selectedAsset.current_value.toLocaleString('pt-BR')}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedAsset(null)}
                className="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-xl shadow-slate-900/20"
              >
                Fechar Visualização
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-lg">Novo Ativo</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Nome do Ativo (Ticker/Empresa)</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: PETR4, AAPL, CDB Itaú"
                  value={formData.asset_name}
                  onChange={e => setFormData({...formData, asset_name: e.target.value})}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Tipo de Ativo</label>
                <select 
                  value={formData.asset_type}
                  onChange={e => setFormData({...formData, asset_type: e.target.value as AssetType})}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                >
                  <option value={AssetType.STOCK}>Ações</option>
                  <option value={AssetType.FIXED_INCOME}>Renda Fixa</option>
                  <option value={AssetType.FII}>FIIs</option>
                  <option value={AssetType.CRYPTO}>Cripto</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Total Aplicado (R$)</label>
                  <input 
                    type="number" 
                    required
                    value={formData.amount_invested || ''}
                    onChange={e => setFormData({...formData, amount_invested: parseFloat(e.target.value)})}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Valor Atual (R$)</label>
                  <input 
                    type="number" 
                    required
                    value={formData.current_value || ''}
                    onChange={e => setFormData({...formData, current_value: parseFloat(e.target.value)})}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Data da Compra</label>
                <input 
                  type="date" 
                  value={formData.date_invested}
                  onChange={e => setFormData({...formData, date_invested: e.target.value})}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-lg shadow-blue-500/20 flex items-center justify-center"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Ativo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestmentsView;
