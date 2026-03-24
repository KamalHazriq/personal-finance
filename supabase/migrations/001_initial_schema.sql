-- ============================================================================
-- Wealth Tracker - Initial Schema Migration
-- ============================================================================
-- Personal finance "Wealth Tracker" app using Supabase + Postgres
-- Supports multi-user via RLS, monthly net-worth tracking, goals, and imports.
-- ============================================================================

-- ============================================================================
-- 1. TABLES
-- ============================================================================

-- --------------------------------------------------------------------------
-- profiles
-- --------------------------------------------------------------------------
CREATE TABLE profiles (
    id         uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email      text        NOT NULL,
    full_name  text,
    currency   text        DEFAULT 'MYR',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- --------------------------------------------------------------------------
-- account_categories
-- --------------------------------------------------------------------------
CREATE TABLE account_categories (
    id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name       text        NOT NULL,
    type       text        NOT NULL CHECK (type IN ('asset', 'liability', 'income')),
    sort_order int         DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    UNIQUE (user_id, name)
);

-- --------------------------------------------------------------------------
-- accounts
-- --------------------------------------------------------------------------
CREATE TABLE accounts (
    id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id  uuid        NOT NULL REFERENCES account_categories(id) ON DELETE CASCADE,
    name         text        NOT NULL,
    account_type text        NOT NULL CHECK (account_type IN (
                                 'bank', 'investment', 'liability', 'income',
                                 'cash', 'crypto', 'retirement', 'gold', 'ewallet'
                             )),
    institution    text,
    currency       text        DEFAULT 'MYR',
    is_locked_fund boolean     DEFAULT false,
    is_active      boolean     DEFAULT true,
    notes          text,
    sort_order     int         DEFAULT 0,
    created_at     timestamptz DEFAULT now(),
    updated_at     timestamptz DEFAULT now(),
    UNIQUE (user_id, name)
);

-- --------------------------------------------------------------------------
-- monthly_account_values
-- --------------------------------------------------------------------------
CREATE TABLE monthly_account_values (
    id         uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id    uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id uuid          NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    month_date date          NOT NULL,
    value      numeric(15,2) NOT NULL DEFAULT 0,
    source     text          DEFAULT 'manual' CHECK (source IN ('manual', 'import')),
    notes      text,
    created_at timestamptz   DEFAULT now(),
    updated_at timestamptz   DEFAULT now(),
    UNIQUE (user_id, account_id, month_date)
);

-- --------------------------------------------------------------------------
-- monthly_snapshots
-- --------------------------------------------------------------------------
CREATE TABLE monthly_snapshots (
    id                  uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id             uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month_date          date          NOT NULL,
    total_assets        numeric(15,2) DEFAULT 0,
    total_liabilities   numeric(15,2) DEFAULT 0,
    net_worth           numeric(15,2) DEFAULT 0,
    net_worth_ex_locked numeric(15,2) DEFAULT 0,
    total_locked_assets numeric(15,2) DEFAULT 0,
    mom_change          numeric(15,2) DEFAULT 0,
    mom_change_pct      numeric(8,2)  DEFAULT 0,
    yoy_change          numeric(15,2) DEFAULT 0,
    yoy_change_pct      numeric(8,2)  DEFAULT 0,
    created_at          timestamptz   DEFAULT now(),
    updated_at          timestamptz   DEFAULT now(),
    UNIQUE (user_id, month_date)
);

-- --------------------------------------------------------------------------
-- goals
-- --------------------------------------------------------------------------
CREATE TABLE goals (
    id                 uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id            uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title              text          NOT NULL,
    goal_type          text          NOT NULL CHECK (goal_type IN (
                                        'net_worth', 'net_worth_ex_locked',
                                        'category_total', 'account_value'
                                    )),
    target_value       numeric(15,2) NOT NULL,
    target_date        date          NOT NULL,
    target_account_id  uuid          REFERENCES accounts(id) ON DELETE SET NULL,
    target_category_id uuid          REFERENCES account_categories(id) ON DELETE SET NULL,
    start_value        numeric(15,2) DEFAULT 0,
    start_date         date          NOT NULL,
    is_archived        boolean       DEFAULT false,
    created_at         timestamptz   DEFAULT now(),
    updated_at         timestamptz   DEFAULT now()
);

-- --------------------------------------------------------------------------
-- imports
-- --------------------------------------------------------------------------
CREATE TABLE imports (
    id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    filename      text        NOT NULL,
    import_status text        DEFAULT 'pending' CHECK (import_status IN (
                                  'pending', 'processing', 'completed', 'failed'
                              )),
    total_rows    int         DEFAULT 0,
    success_rows  int         DEFAULT 0,
    failed_rows   int         DEFAULT 0,
    skipped_rows  int         DEFAULT 0,
    mapping_json  jsonb,
    created_at    timestamptz DEFAULT now()
);

-- --------------------------------------------------------------------------
-- import_rows
-- --------------------------------------------------------------------------
CREATE TABLE import_rows (
    id                  uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id             uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    import_id           uuid          NOT NULL REFERENCES imports(id) ON DELETE CASCADE,
    raw_data            jsonb         NOT NULL,
    status              text          DEFAULT 'pending' CHECK (status IN (
                                          'pending', 'success', 'failed', 'skipped', 'duplicate'
                                      )),
    error_message       text,
    resolved_account_id uuid          REFERENCES accounts(id) ON DELETE SET NULL,
    month_date          date,
    value               numeric(15,2)
);


-- ============================================================================
-- 2. ROW LEVEL SECURITY
-- ============================================================================

-- --------------------------------------------------------------------------
-- profiles  (uses id = auth.uid())
-- --------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON profiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_insert" ON profiles
    FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update" ON profiles
    FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_delete" ON profiles
    FOR DELETE USING (id = auth.uid());

-- --------------------------------------------------------------------------
-- account_categories
-- --------------------------------------------------------------------------
ALTER TABLE account_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "account_categories_select" ON account_categories
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "account_categories_insert" ON account_categories
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "account_categories_update" ON account_categories
    FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "account_categories_delete" ON account_categories
    FOR DELETE USING (user_id = auth.uid());

-- --------------------------------------------------------------------------
-- accounts
-- --------------------------------------------------------------------------
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "accounts_select" ON accounts
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "accounts_insert" ON accounts
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "accounts_update" ON accounts
    FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "accounts_delete" ON accounts
    FOR DELETE USING (user_id = auth.uid());

-- --------------------------------------------------------------------------
-- monthly_account_values
-- --------------------------------------------------------------------------
ALTER TABLE monthly_account_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "monthly_account_values_select" ON monthly_account_values
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "monthly_account_values_insert" ON monthly_account_values
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "monthly_account_values_update" ON monthly_account_values
    FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "monthly_account_values_delete" ON monthly_account_values
    FOR DELETE USING (user_id = auth.uid());

-- --------------------------------------------------------------------------
-- monthly_snapshots
-- --------------------------------------------------------------------------
ALTER TABLE monthly_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "monthly_snapshots_select" ON monthly_snapshots
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "monthly_snapshots_insert" ON monthly_snapshots
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "monthly_snapshots_update" ON monthly_snapshots
    FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "monthly_snapshots_delete" ON monthly_snapshots
    FOR DELETE USING (user_id = auth.uid());

-- --------------------------------------------------------------------------
-- goals
-- --------------------------------------------------------------------------
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "goals_select" ON goals
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "goals_insert" ON goals
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "goals_update" ON goals
    FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "goals_delete" ON goals
    FOR DELETE USING (user_id = auth.uid());

-- --------------------------------------------------------------------------
-- imports
-- --------------------------------------------------------------------------
ALTER TABLE imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "imports_select" ON imports
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "imports_insert" ON imports
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "imports_update" ON imports
    FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "imports_delete" ON imports
    FOR DELETE USING (user_id = auth.uid());

-- --------------------------------------------------------------------------
-- import_rows
-- --------------------------------------------------------------------------
ALTER TABLE import_rows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "import_rows_select" ON import_rows
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "import_rows_insert" ON import_rows
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "import_rows_update" ON import_rows
    FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "import_rows_delete" ON import_rows
    FOR DELETE USING (user_id = auth.uid());


-- ============================================================================
-- 3. INDEXES
-- ============================================================================

CREATE INDEX idx_account_categories_user_id ON account_categories(user_id);

CREATE INDEX idx_accounts_user_id_category_id ON accounts(user_id, category_id);
CREATE INDEX idx_accounts_category_id ON accounts(category_id);

CREATE INDEX idx_monthly_account_values_user_month ON monthly_account_values(user_id, month_date);
CREATE INDEX idx_monthly_account_values_account_id ON monthly_account_values(account_id);

CREATE INDEX idx_monthly_snapshots_user_month ON monthly_snapshots(user_id, month_date);

CREATE INDEX idx_goals_user_id ON goals(user_id);

CREATE INDEX idx_imports_user_id ON imports(user_id);

CREATE INDEX idx_import_rows_import_id ON import_rows(import_id);
CREATE INDEX idx_import_rows_user_id ON import_rows(user_id);


-- ============================================================================
-- 4. TRIGGER FUNCTIONS & TRIGGERS
-- ============================================================================

-- --------------------------------------------------------------------------
-- 4a. handle_new_user  -- auto-create a profile row on signup
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- --------------------------------------------------------------------------
-- 4b. updated_at trigger function
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Apply updated_at trigger to every table that has the column
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON accounts
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON monthly_account_values
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON monthly_snapshots
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON goals
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();


-- ============================================================================
-- 5. recalculate_snapshot FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION public.recalculate_snapshot(
    p_user_id   uuid,
    p_month_date date
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total_assets        numeric(15,2) := 0;
    v_total_liabilities   numeric(15,2) := 0;
    v_net_worth           numeric(15,2) := 0;
    v_total_locked_assets numeric(15,2) := 0;
    v_net_worth_ex_locked numeric(15,2) := 0;
    v_mom_change          numeric(15,2) := 0;
    v_mom_change_pct      numeric(8,2)  := 0;
    v_yoy_change          numeric(15,2) := 0;
    v_yoy_change_pct      numeric(8,2)  := 0;
    v_prev_net_worth      numeric(15,2);
    v_yoy_net_worth       numeric(15,2);
BEGIN
    -- -----------------------------------------------------------------------
    -- Total assets: sum of monthly_account_values for accounts whose
    -- category type = 'asset'
    -- -----------------------------------------------------------------------
    SELECT COALESCE(SUM(mav.value), 0)
      INTO v_total_assets
      FROM monthly_account_values mav
      JOIN accounts          a  ON a.id  = mav.account_id
      JOIN account_categories ac ON ac.id = a.category_id
     WHERE mav.user_id    = p_user_id
       AND mav.month_date = p_month_date
       AND ac.type         = 'asset';

    -- -----------------------------------------------------------------------
    -- Total liabilities
    -- -----------------------------------------------------------------------
    SELECT COALESCE(SUM(mav.value), 0)
      INTO v_total_liabilities
      FROM monthly_account_values mav
      JOIN accounts          a  ON a.id  = mav.account_id
      JOIN account_categories ac ON ac.id = a.category_id
     WHERE mav.user_id    = p_user_id
       AND mav.month_date = p_month_date
       AND ac.type         = 'liability';

    -- -----------------------------------------------------------------------
    -- Net worth
    -- -----------------------------------------------------------------------
    v_net_worth := v_total_assets - v_total_liabilities;

    -- -----------------------------------------------------------------------
    -- Total locked assets (is_locked_fund = true, category type = 'asset')
    -- -----------------------------------------------------------------------
    SELECT COALESCE(SUM(mav.value), 0)
      INTO v_total_locked_assets
      FROM monthly_account_values mav
      JOIN accounts          a  ON a.id  = mav.account_id
      JOIN account_categories ac ON ac.id = a.category_id
     WHERE mav.user_id    = p_user_id
       AND mav.month_date = p_month_date
       AND ac.type         = 'asset'
       AND a.is_locked_fund = true;

    -- -----------------------------------------------------------------------
    -- Net worth excluding locked fund accounts
    -- -----------------------------------------------------------------------
    v_net_worth_ex_locked := (v_total_assets - v_total_locked_assets) - v_total_liabilities;

    -- -----------------------------------------------------------------------
    -- Month-over-month change (previous month)
    -- -----------------------------------------------------------------------
    SELECT ms.net_worth
      INTO v_prev_net_worth
      FROM monthly_snapshots ms
     WHERE ms.user_id    = p_user_id
       AND ms.month_date = (p_month_date - INTERVAL '1 month')::date;

    IF v_prev_net_worth IS NOT NULL THEN
        v_mom_change := v_net_worth - v_prev_net_worth;
        IF v_prev_net_worth <> 0 THEN
            v_mom_change_pct := ROUND((v_mom_change / v_prev_net_worth) * 100, 2);
        END IF;
    END IF;

    -- -----------------------------------------------------------------------
    -- Year-over-year change (same month last year)
    -- -----------------------------------------------------------------------
    SELECT ms.net_worth
      INTO v_yoy_net_worth
      FROM monthly_snapshots ms
     WHERE ms.user_id    = p_user_id
       AND ms.month_date = (p_month_date - INTERVAL '1 year')::date;

    IF v_yoy_net_worth IS NOT NULL THEN
        v_yoy_change := v_net_worth - v_yoy_net_worth;
        IF v_yoy_net_worth <> 0 THEN
            v_yoy_change_pct := ROUND((v_yoy_change / v_yoy_net_worth) * 100, 2);
        END IF;
    END IF;

    -- -----------------------------------------------------------------------
    -- Upsert into monthly_snapshots
    -- -----------------------------------------------------------------------
    INSERT INTO monthly_snapshots (
        user_id,
        month_date,
        total_assets,
        total_liabilities,
        net_worth,
        net_worth_ex_locked,
        total_locked_assets,
        mom_change,
        mom_change_pct,
        yoy_change,
        yoy_change_pct
    ) VALUES (
        p_user_id,
        p_month_date,
        v_total_assets,
        v_total_liabilities,
        v_net_worth,
        v_net_worth_ex_locked,
        v_total_locked_assets,
        v_mom_change,
        v_mom_change_pct,
        v_yoy_change,
        v_yoy_change_pct
    )
    ON CONFLICT (user_id, month_date) DO UPDATE SET
        total_assets        = EXCLUDED.total_assets,
        total_liabilities   = EXCLUDED.total_liabilities,
        net_worth           = EXCLUDED.net_worth,
        net_worth_ex_locked = EXCLUDED.net_worth_ex_locked,
        total_locked_assets = EXCLUDED.total_locked_assets,
        mom_change          = EXCLUDED.mom_change,
        mom_change_pct      = EXCLUDED.mom_change_pct,
        yoy_change          = EXCLUDED.yoy_change,
        yoy_change_pct      = EXCLUDED.yoy_change_pct,
        updated_at          = now();
END;
$$;
