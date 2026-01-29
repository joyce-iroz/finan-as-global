
import React, { useMemo, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertCircle, TrendingUp, ShieldCheck, Zap, TrendingDown, CheckCircle2, MinusCircle } from 'lucide-react';
import { Transaction, Investment, TransactionType } from '../types';

interface MetricsViewProps {
  transactions: Transaction[];
  investments: Investment[];
}

const MetricsView: React.FC<MetricsViewProps> = ({ transactions, investments }) => {
  const chartRef = useRef<HTMLDivElement>(null);

  const metrics = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMonthTransactions = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const monthIncome = currentMonthTransactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((acc, curr) => acc + curr.amount, 0);
    
    const monthExpense = currentMonthTransactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((acc, curr) => acc + curr.amount, 0);

    const totalIncome = transactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpense = transactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((acc, curr) => acc + curr.amount, 0);
    const totalInvested = investments.reduce((acc, curr) => acc + curr.current_value, 0);
    const netWorth = (totalIncome - totalExpense) + totalInvested;
    
    const savingsRate = monthIncome > 0 
      ? Math.max(0, ((monthIncome - monthExpense) / monthIncome) * 100) 
      : 0;

    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const last6Months = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mLabel = months[d.getMonth()];
      const mYear = d.getFullYear();
      
      const mTrans = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === d.getMonth() && tDate.getFullYear() === mYear;
      });

      last6Months.push({
        month: mLabel,
        income: mTrans.filter(t => t.type === TransactionType.INCOME).reduce((acc, curr) => acc + curr.amount, 0),
        expenses: mTrans.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, curr) => acc + curr.amount, 0)
      });
    }

    // NOVA LÓGICA DE DIAGNÓSTICO
    const noData = monthIncome === 0 && monthExpense === 0;
    const isCritical = (monthIncome === 0 && monthExpense > 0) || (monthExpense > monthIncome);
    const isPerfectMonth = monthIncome > 0 && monthExpense <= (monthIncome * 0.5) && !isCritical;
    const isOverspending = monthIncome > 0 && monthExpense > (monthIncome * 0.8) && monthExpense <= monthIncome;

    return {
      savingsRate: Math.round(savingsRate),
      netWorth,
      monthIncome,
      monthExpense,
      monthlyTrends: last6Months,
      noData,
      isCritical,
      isOverspending,
      isPerfectMonth
    };
  }, [transactions, investments]);

  const scrollToChart = () => {
    chartRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getHealthStyles = () => {
    if (metrics.noData) return 'bg-slate-50 border-slate-200 text-slate-500';
    if (metrics.isCritical) return 'bg-red-50 border-red-200 text-red-900';
    if (metrics.isPerfectMonth) return 'bg-emerald-50 border-emerald-200 text-emerald-900';
    if (metrics.isOverspending) return 'bg-amber-50 border-amber-200 text-amber-900';
    return 'bg-green-50 border-green-200 text-green-900';
  };

  const getHealthIcon = () => {
    if (metrics.noData) return <MinusCircle className="w-5 h-5 text-slate-400" />;
    if (metrics.isCritical) return <AlertCircle className="w-5 h-5 text-red-600" />;
    if (metrics.isPerfectMonth) return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
    if (metrics.isOverspending) return <AlertCircle className="w-5 h-5 text-amber-600" />;
    return <TrendingUp className="w-5 h-5 text-green-600" />;
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm group hover:border-blue-200 transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Taxa de Poupança</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Mês Atual</p>
            </div>
          </div>
          <p className="text-4xl font-black text-slate-900 mb-2">{metrics.savingsRate}%</p>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-1000 ${metrics.savingsRate > 20 ? 'bg-blue-600' : 'bg-amber-500'}`} 
              style={{ width: `${metrics.savingsRate}%` }} 
            />
          </div>
          <p className="text-xs text-slate-500 mt-3 flex items-center gap-1 font-medium">
            {metrics.monthIncome === 0 ? (
              <><MinusCircle className="w-3.5 h-3.5 text-slate-400" /> Sem receita registrada</>
            ) : metrics.savingsRate > 20 ? (
              <><TrendingUp className="w-3.5 h-3.5 text-green-500" /> Rendimento acima da média</>
            ) : (
              <><TrendingDown className="w-3.5 h-3.5 text-amber-500" /> Margem de segurança baixa</>
            )}
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm group hover:border-purple-200 transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Patrimônio Líquido</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Global</p>
            </div>
          </div>
          <p className="text-4xl font-black text-slate-900 mb-2">R$ {metrics.netWorth.toLocaleString('pt-BR')}</p>
          <p className="text-xs text-slate-500 font-medium">Liquidez + Investimentos ativos</p>
          <div className="flex gap-2 mt-4">
            <span className="px-2.5 py-1 bg-green-50 text-green-700 text-[9px] font-black rounded-lg uppercase tracking-wider">Sync Ativo</span>
            <span className="px-2.5 py-1 bg-slate-50 text-slate-500 text-[9px] font-black rounded-lg uppercase tracking-wider">Real-time</span>
          </div>
        </div>

        <div className={`p-6 rounded-3xl border transition-all ${getHealthStyles()}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-xl bg-white/50 backdrop-blur-sm shadow-sm`}>
              {getHealthIcon()}
            </div>
            <div>
              <h4 className="font-bold text-sm">
                {metrics.noData ? 'Aguardando Dados' : metrics.isCritical ? 'Déficit Financeiro' : metrics.isPerfectMonth ? 'Mês de Ouro' : 'Saúde Financeira'}
              </h4>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Diagnóstico Mensal</p>
            </div>
          </div>
          <p className="text-sm leading-relaxed mb-4 font-medium opacity-90">
            {metrics.noData 
              ? 'Registre suas primeiras transações para receber um diagnóstico de saúde financeira.'
              : metrics.isCritical 
              ? (metrics.monthIncome === 0 
                  ? `Alerta Crítico: Você possui R$ ${metrics.monthExpense.toLocaleString('pt-BR')} em despesas, mas nenhuma receita registrada este mês.` 
                  : `Atenção: Suas despesas (R$ ${metrics.monthExpense.toLocaleString('pt-BR')}) ultrapassaram sua receita. Cuidado com o endividamento!`)
              : metrics.isPerfectMonth 
              ? `Excelente! Você poupou mais de 50% da sua receita de R$ ${metrics.monthIncome.toLocaleString('pt-BR')} este mês.`
              : metrics.isOverspending
              ? `Alerta: Seus gastos consumiram mais de 80% da sua receita. Tente reduzir custos variáveis.`
              : 'Bom trabalho! Suas despesas estão equilibradas e você está operando no azul.'}
          </p>
          {!metrics.noData && (
            <button 
              onClick={scrollToChart}
              className="text-[10px] font-black uppercase tracking-widest hover:underline"
            >
              Analisar Fluxo de Caixa
            </button>
          )}
        </div>
      </div>

      <div ref={chartRef} className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm scroll-mt-8 group hover:border-blue-200 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Histórico de Performance</h3>
            <p className="text-sm text-slate-500 font-medium">Comparativo de entrada vs saída nos últimos 6 meses</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-600 rounded-full" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Receita</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-slate-200 rounded-full" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Despesas</span>
            </div>
          </div>
        </div>
        
        <div className="h-[400px] w-full">
          {metrics.monthlyTrends.some(m => m.income > 0 || m.expenses > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.monthlyTrends} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 11, fill: '#94a3b8', fontWeight: '700'}} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 11, fill: '#94a3b8', fontWeight: '700'}} 
                />
                <Tooltip 
                  cursor={{fill: '#f8fafc', radius: 8}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '12px'}}
                  formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']}
                  labelStyle={{fontWeight: '800', color: '#1e293b', marginBottom: '4px'}}
                />
                <Bar dataKey="income" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={32} name="Receita" />
                <Bar dataKey="expenses" fill="#e2e8f0" radius={[6, 6, 0, 0]} barSize={32} name="Despesas" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 italic">
              <div className="p-4 bg-slate-50 rounded-full mb-4">
                <BarChart className="w-8 h-8 opacity-20" />
              </div>
              <p className="text-sm font-medium">Aguardando dados históricos das transações...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetricsView;
