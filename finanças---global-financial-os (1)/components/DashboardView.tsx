
import React from 'react';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  DollarSign, 
  Calendar,
  ChevronRight,
  Target,
  Inbox
} from 'lucide-react';
import { DashboardStats, Transaction, Investment, SavingsGoal, TransactionType, AssetType } from '../types';

interface DashboardViewProps {
  stats: DashboardStats;
  transactions: Transaction[];
  investments: Investment[];
  goals: SavingsGoal[];
  onNavigate: (tab: string) => void;
}

const COLORS = ['#2563eb', '#7c3aed', '#db2777', '#f59e0b', '#10b981'];

const DashboardView: React.FC<DashboardViewProps> = ({ stats, transactions, investments, goals, onNavigate }) => {
  const lineData = transactions.length > 0 ? [
    { name: 'Jan', balance: 0 },
    { name: 'Hoje', balance: stats.totalBalance },
  ] : [];

  const expenseByCategory = transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc: any[], curr) => {
      const idx = acc.findIndex(a => a.name === curr.category);
      if (idx > -1) acc[idx].value += curr.amount;
      else acc.push({ name: curr.category, value: curr.amount });
      return acc;
    }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Saldo Total', value: `R$ ${stats.totalBalance.toLocaleString('pt-BR')}`, icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Receita Mensal', value: `R$ ${stats.monthlyIncome.toLocaleString('pt-BR')}`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Despesas Mensais', value: `R$ ${stats.monthlyExpenses.toLocaleString('pt-BR')}`, icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Investido', value: `R$ ${stats.totalInvested.toLocaleString('pt-BR')}`, icon: Wallet, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Progresso Metas', value: `${stats.avgGoalProgress.toFixed(1)}%`, icon: Target, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((card, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className={`${card.bg} ${card.color} w-10 h-10 rounded-xl flex items-center justify-center mb-4`}>
              <card.icon className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-slate-500 mb-1">{card.label}</p>
            <p className="text-xl font-bold text-slate-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm min-h-[350px]">
          <h3 className="font-bold text-slate-900 mb-6">Evolução do Saldo</h3>
          {lineData.length > 0 ? (
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={lineData}>
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Saldo']}
                  />
                  <Area type="monotone" dataKey="balance" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-12 text-slate-400">
              <Inbox className="w-12 h-12 mb-2 opacity-20" />
              <p className="text-sm">Nenhum dado para exibir o gráfico.</p>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm min-h-[350px]">
          <h3 className="font-bold text-slate-900 mb-6">Gastos por Categoria</h3>
          {expenseByCategory.length > 0 ? (
            <div className="h-[250px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {expenseByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`} />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{paddingTop: '20px', fontSize: '11px'}} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-12 text-slate-400">
              <Inbox className="w-12 h-12 mb-2 opacity-20" />
              <p className="text-sm">Sem gastos registrados.</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900">Transações Recentes</h3>
          </div>
          <div className="space-y-4">
            {transactions.length > 0 ? (
              transactions.slice(0, 5).map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === TransactionType.INCOME ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {t.type === TransactionType.INCOME ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{t.description}</p>
                      <p className="text-xs text-slate-500">{t.category} • {t.date}</p>
                    </div>
                  </div>
                  <p className={`text-sm font-bold ${t.type === TransactionType.INCOME ? 'text-green-600' : 'text-slate-900'}`}>
                    {t.type === TransactionType.INCOME ? '+' : '-'}R$ {t.amount.toLocaleString('pt-BR')}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-center py-8 text-slate-400 text-sm">Nenhuma transação registrada.</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-6">Metas de Economia</h3>
          {goals.length > 0 ? (
            <div className="space-y-6">
              {goals.map((goal) => {
                const progress = (goal.current_amount / goal.target_amount) * 100;
                return (
                  <div key={goal.id}>
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{goal.name}</p>
                        <p className="text-xs text-slate-500">Faltam: R$ {(goal.target_amount - goal.current_amount).toLocaleString('pt-BR')}</p>
                      </div>
                      <p className="text-xs font-bold text-slate-900">{progress.toFixed(0)}%</p>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-1000" 
                        style={{ width: `${progress}%` }} 
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">Prazo: {goal.deadline}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <Target className="w-12 h-12 mb-2 opacity-20" />
              <p className="text-sm">Você ainda não definiu metas.</p>
            </div>
          )}
          <button 
            onClick={() => onNavigate('goals')}
            className="w-full mt-6 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-sm font-bold transition-colors border border-slate-200"
          >
            Nova Meta
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
