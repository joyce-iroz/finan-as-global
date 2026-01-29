
export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense'
}

export enum PaymentMethod {
  CASH = 'cash',
  DEBIT = 'debit',
  CREDIT = 'credit'
}

export enum AssetType {
  FIXED_INCOME = 'fixed_income',
  STOCK = 'stock',
  FII = 'fii',
  CRYPTO = 'crypto'
}

export interface PaymentCard {
  id: string;
  user_id: string;
  card_name: string;
  card_brand: string;
  last_four: string;
  color: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  payment_method: PaymentMethod;
  account: string;
  date: string;
  description: string;
}

export interface Investment {
  id: string;
  asset_name: string;
  asset_type: AssetType;
  amount_invested: number;
  current_value: number;
  date_invested: string;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
  goal_shares?: { id: string; shared_with_email: string }[];
}

export interface DashboardStats {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  totalInvested: number;
  avgGoalProgress: number;
}
