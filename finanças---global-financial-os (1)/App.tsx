
import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ArrowUpCircle, 
  Wallet, 
  Target, 
  BarChart3, 
  Settings, 
  Menu, 
  LogOut,
  Loader2,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { supabase } from './supabase';
import DashboardView from './components/DashboardView';
import TransactionsView from './components/TransactionsView';
import InvestmentsView from './components/InvestmentsView';
import GoalsView from './components/GoalsView';
import MetricsView from './components/MetricsView';
import AuthView from './components/AuthView';
import SettingsView from './components/SettingsView';
import { Transaction, Investment, SavingsGoal, TransactionType } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<any>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setUser(session?.user || null);
      if (session) fetchData(session.user);
      else setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      setUser(session?.user || null);
      if (session) fetchData(session.user);
      else {
        setTransactions([]);
        setInvestments([]);
        setGoals([]);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchData = async (currentUser: any, silent = false) => {
    if (!currentUser) return;
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    setDbError(null);

    try {
      // Ajuste na query: Buscar todos os compartilhamentos relevantes para o usuário
      // onde ele é dono OU onde ele foi convidado
      const [transRes, invRes, goalsRes, sharesRes] = await Promise.all([
        supabase.from('transactions').select('*').order('date', { ascending: false }),
        supabase.from('investments').select('*'),
        supabase.from('savings_goals').select('*'),
        supabase.from('goal_shares')
          .select('*')
          .or(`owner_id.eq.${currentUser.id},shared_with_email.eq.${currentUser.email}`)
      ]);

      if (transRes.error?.code === '42P01' || goalsRes.error?.code === '42P01') {
        setDbError('DATABASE_NOT_READY');
        return;
      }
      
      if (sharesRes.error?.code === '42703') {
        setDbError('SCHEMA_UPDATE_REQUIRED');
        return;
      }

      // Filtrar as metas com base nos compartilhamentos
      const allGoals = (goalsRes.data || []).map(goal => ({
        ...goal,
        goal_shares: (sharesRes.data || []).filter(s => s.goal_id === goal.id)
      }));

      setTransactions(transRes.data || []);
      setInvestments(invRes.data || []);
      setGoals(allGoals as SavingsGoal[]);
      
    } catch (error) {
      console.error('Falha na sincronização:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const stats = useMemo(() => {
    const totalIncome = transactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpense = transactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((acc, curr) => acc + curr.amount, 0);

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthlyTransactions = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const monthlyIncome = monthlyTransactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((acc, curr) => acc + curr.amount, 0);
    const monthlyExpenses = monthlyTransactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((acc, curr) => acc + curr.amount, 0);

    const totalInvested = investments.reduce((acc, curr) => acc + curr.current_value, 0);
    
    const goalProgress = goals.length > 0 
      ? goals.reduce((acc, curr) => acc + (curr.current_amount / curr.target_amount), 0) / goals.length 
      : 0;

    return {
      totalBalance: totalIncome - totalExpense,
      monthlyIncome,
      monthlyExpenses,
      totalInvested,
      avgGoalProgress: Math.min(100, goalProgress * 100)
    };
  }, [transactions, investments, goals]);

  const navItems = [
    { id: 'dashboard', label: 'Painel Geral', icon: LayoutDashboard },
    { id: 'transactions', label: 'Receitas & Despesas', icon: ArrowUpCircle },
    { id: 'investments', label: 'Investimentos', icon: Wallet },
    { id: 'goals', label: 'Metas de Poupança', icon: Target },
    { id: 'metrics', label: 'Relatórios', icon: BarChart3 },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 animate-pulse">
          <div className="bg-blue-50 p-6 rounded-full">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          </div>
          <p className="text-sm font-bold text-slate-600">Sincronizando com a Nuvem...</p>
        </div>
      );
    }

    if (dbError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center max-w-lg mx-auto">
          <div className="bg-amber-100 p-6 rounded-3xl mb-6 shadow-inner">
            <AlertTriangle className="w-12 h-12 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Ação Necessária</h2>
          <p className="text-slate-600 mb-8 leading-relaxed">O banco de dados precisa ser atualizado para a Versão 6.3 para permitir a gestão colaborativa de metas.</p>
          <button 
            onClick={() => fetchData(user)}
            className="px-8 py-3.5 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" /> Tentar Sincronizar Novamente
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard': return <DashboardView stats={stats} transactions={transactions} investments={investments} goals={goals} onNavigate={setActiveTab} />;
      case 'transactions': return <TransactionsView transactions={transactions} setTransactions={setTransactions} onRefresh={() => fetchData(user, true)} />;
      case 'investments': return <InvestmentsView investments={investments} setInvestments={setInvestments} onRefresh={() => fetchData(user, true)} />;
      case 'goals': return <GoalsView goals={goals} setGoals={setGoals} onRefresh={() => fetchData(user, true)} currentUser={user} isRefreshing={isRefreshing} />;
      case 'metrics': return <MetricsView transactions={transactions} investments={investments} />;
      case 'settings': return <SettingsView user={user} onRefresh={() => fetchData(user, true)} />;
      default: return <div className="p-8 text-slate-500 italic">Recurso não encontrado.</div>;
    }
  };

  if (isAuthenticated === null) return null;
  if (!isAuthenticated) return <AuthView onLogin={() => setIsAuthenticated(true)} />;

  return (
    <div className="min-h-screen flex bg-slate-50 overflow-hidden animate-in fade-in duration-700 font-sans">
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-out
        lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-8 flex items-center gap-3">
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-700 p-2.5 rounded-2xl shadow-xl shadow-blue-500/20 rotate-3">
              <BarChart3 className="text-white w-6 h-6" />
            </div>
            <div>
               <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">Finanças</h1>
               <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Global OS</span>
            </div>
          </div>

          <nav className="flex-1 px-4 space-y-1 overflow-y-auto pt-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all
                  ${activeTab === item.id 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
                `}
              >
                <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-white' : 'text-slate-400'}`} />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="p-6 m-4 bg-slate-50 rounded-3xl border border-slate-100">
             <div className="flex items-center justify-between mb-4">
               <button 
                onClick={() => fetchData(user, true)}
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-sm rounded-xl transition-all"
                title="Sincronizar"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <button 
                onClick={async () => { await supabase.auth.signOut(); setIsAuthenticated(false); }}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-white hover:shadow-sm rounded-xl transition-all"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center font-black text-blue-600 text-xs">
                {user?.email?.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 truncate">
                <p className="text-xs font-black text-slate-900 truncate">{user?.email?.split('@')[0]}</p>
                <p className="text-[9px] font-bold text-green-600 uppercase tracking-widest">Premium Active</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 lg:px-10 shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-slate-500 lg:hidden hover:bg-slate-100 rounded-xl transition-colors">
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {navItems.find(i => i.id === activeTab)?.label}
            </h2>
          </div>
          
          <div className="flex items-center gap-6">
             <div className="hidden sm:flex flex-col items-end">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Network Status</span>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs font-black text-slate-900 uppercase">Supabase Cloud</span>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-10 bg-slate-50/50">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
