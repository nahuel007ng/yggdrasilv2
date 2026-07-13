-- Migration: savings_transactions table
-- Brief: v2-8-finanzas-deprecar-pwa
-- Date: 2026-07-13

CREATE TABLE savings_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amount DOUBLE PRECISION NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
    description TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_savings_user_date ON savings_transactions (user_id, date);

ALTER TABLE savings_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own savings" ON savings_transactions
    FOR ALL USING (auth.uid() = user_id);
