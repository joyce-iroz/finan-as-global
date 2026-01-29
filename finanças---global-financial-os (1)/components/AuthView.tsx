
import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, BarChart3, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../supabase';

interface AuthViewProps {
  onLogin: () => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (authError) throw authError;
        onLogin();
      } else {
        const { error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name }
          }
        });
        if (authError) throw authError;
        alert('Conta criada! Verifique seu email para confirmar ou tente entrar.');
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro na autenticação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 relative overflow-hidden p-4">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="inline-flex items-center justify-center p-3 bg-blue-600 rounded-2xl mb-4 shadow-xl shadow-blue-500/20">
            <BarChart3 className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Finanças</h1>
          <p className="text-slate-400 mt-2">Sincronize sua vida financeira na nuvem</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-500">
          <div className="flex bg-slate-800/50 p-1 rounded-xl mb-8">
            <button 
              onClick={() => { setIsLogin(true); setError(null); }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isLogin ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Entrar
            </button>
            <button 
              onClick={() => { setIsLogin(false); setError(null); }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isLogin ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Criar Conta
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 text-xs animate-in slide-in-from-top-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Como prefere ser chamado?"
                    className="w-full bg-slate-800/50 border border-slate-700 text-white pl-11 pr-4 py-3.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full bg-slate-800/50 border border-slate-700 text-white pl-11 pr-4 py-3.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Senha</label>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-800/50 border border-slate-700 text-white pl-11 pr-4 py-3.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2 group mt-4"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Acessar Painel' : 'Finalizar Cadastro'}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 flex items-center gap-3 text-slate-500">
            <ShieldCheck className="w-5 h-5 text-green-500" />
            <p className="text-[10px] font-medium leading-tight">
              Sua conta está integrada ao cluster Supabase seguro com PostgreSQL.
            </p>
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs mt-8">
          Finanças v3.0 • Powered by Supabase Cloud
        </p>
      </div>
    </div>
  );
};

export default AuthView;
