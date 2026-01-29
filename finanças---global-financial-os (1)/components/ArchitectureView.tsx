
import React, { useState } from 'react';
import { Database, Code, Copy, Check, Terminal } from 'lucide-react';
import { ARCHITECTURE_SPEC } from '../constants';

const ArchitectureView: React.FC = () => {
  const [activeView, setActiveView] = useState<'sql' | 'api' | 'setup'>('setup');
  const [copied, setCopied] = useState(false);

  const fullSqlScript = `-- SETUP COMPLETO E ROBUSTO FINANÇAS V6.3 (COLABORATIVO FINAL)
-- Correção definitiva para deleção e edição por convidados.

-- 1. TABELAS (Garantindo que existam)
CREATE TABLE IF NOT EXISTS payment_cards (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  card_name text NOT NULL,
  card_brand text DEFAULT 'Mastercard',
  last_four text,
  color text DEFAULT 'blue',
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  type text NOT NULL,
  amount numeric NOT NULL,
  category text,
  payment_method text,
  account text,
  date date NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS investments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  asset_name text NOT NULL,
  asset_type text NOT NULL,
  amount_invested numeric NOT NULL,
  current_value numeric NOT NULL,
  date_invested date,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS savings_goals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  target_amount numeric NOT NULL,
  current_amount numeric DEFAULT 0,
  deadline date,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS goal_shares (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id uuid REFERENCES savings_goals(id) ON DELETE CASCADE,
  owner_id uuid REFERENCES auth.users(id) NOT NULL,
  shared_with_email text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(goal_id, shared_with_email)
);

-- 2. RESET DE SEGURANÇA (Garantir novo estado)
ALTER TABLE payment_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_shares ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS DE ACESSO

-- Tabelas Privadas (Apenas Dono)
DROP POLICY IF EXISTS "user_all_cards" ON payment_cards;
CREATE POLICY "user_all_cards" ON payment_cards FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_all_transactions" ON transactions;
CREATE POLICY "user_all_transactions" ON transactions FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_all_investments" ON investments;
CREATE POLICY "user_all_investments" ON investments FOR ALL USING (auth.uid() = user_id);

-- METAS: Política para o DONO (Acesso total)
DROP POLICY IF EXISTS "owner_all_goals" ON savings_goals;
CREATE POLICY "owner_all_goals" ON savings_goals FOR ALL USING (auth.uid() = user_id);

-- METAS: Política para o CONVIDADO (Ver e Editar)
-- Permitir SELECT para convidados
DROP POLICY IF EXISTS "guest_view_goals" ON savings_goals;
CREATE POLICY "guest_view_goals" ON savings_goals FOR SELECT USING (
  id IN (SELECT goal_id FROM goal_shares WHERE LOWER(shared_with_email) = LOWER(auth.email()))
);

-- Permitir UPDATE para convidados
DROP POLICY IF EXISTS "guest_update_goals" ON savings_goals;
CREATE POLICY "guest_update_goals" ON savings_goals FOR UPDATE USING (
  id IN (SELECT goal_id FROM goal_shares WHERE LOWER(shared_with_email) = LOWER(auth.email()))
);

-- COMPARTILHAMENTOS: Dono gerencia, Convidados vêem quem mais está na meta
DROP POLICY IF EXISTS "owner_manage_shares" ON goal_shares;
CREATE POLICY "owner_manage_shares" ON goal_shares FOR ALL USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "guest_view_shares" ON goal_shares;
CREATE POLICY "guest_view_shares" ON goal_shares FOR SELECT USING (
  LOWER(shared_with_email) = LOWER(auth.email())
);
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullSqlScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12 animate-in fade-in duration-500">
      <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <h2 className="text-3xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">System Architecture</h2>
        <p className="text-slate-400 max-w-xl">Blueprint técnico corrigido para deletar e editar metas colaborativas.</p>
        
        <div className="flex flex-wrap gap-4 mt-8">
          <button onClick={() => setActiveView('setup')} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeView === 'setup' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>Script de Setup (V6.3)</button>
          <button onClick={() => setActiveView('sql')} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeView === 'sql' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>Esquema de Tabelas</button>
        </div>
      </div>

      {activeView === 'setup' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-4">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg shrink-0">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-amber-900 mb-1">Correção Definitiva</h4>
              <p className="text-sm text-amber-700 leading-relaxed">
                Este script V6.3 resolve o problema de <b>permissão de exclusão</b> e permite que convidados <b>enxerguem e editem</b> as metas compartilhadas. Execute-o no Supabase agora.
              </p>
            </div>
          </div>

          <div className="relative group">
            <button onClick={handleCopy} className="absolute top-4 right-4 z-10 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-lg transition-all flex items-center gap-2">
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copiado!' : 'Copiar SQL V6.3'}
            </button>
            <pre className="bg-slate-950 text-blue-400 text-[11px] font-mono p-8 rounded-2xl overflow-auto max-h-[600px] leading-relaxed border border-slate-800 shadow-2xl">
              {fullSqlScript}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArchitectureView;
