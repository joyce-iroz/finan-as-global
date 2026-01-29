
export const ARCHITECTURE_SPEC = {
  "ui_layout": {
    "sidebar": ["Dashboard", "Transactions", "Investments", "Savings Goals", "Metrics", "Settings"],
    "dashboard_grid": "3-column responsive grid for summary cards, 2-column for charts, single column for history"
  },
  "database_schema": {
    "transactions": {
      "columns": ["id", "user_id", "type", "amount", "category", "payment_method", "account", "date", "description", "created_at"]
    },
    "investments": {
      "columns": ["id", "user_id", "asset_name", "asset_type", "amount_invested", "current_value", "date_invested"]
    },
    "savings_goals": {
      "columns": ["id", "user_id", "name", "target_amount", "current_amount", "deadline", "created_at"]
    },
    "goal_shares": {
      "columns": ["id", "goal_id", "owner_id", "shared_with_email", "created_at"]
    }
  }
};

export const MOCK_TRANSACTIONS = [];
export const MOCK_INVESTMENTS = [];
export const MOCK_GOALS = [];
