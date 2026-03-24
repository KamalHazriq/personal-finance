-- Seed default data for a newly signed-up user.
-- Usage: SELECT public.seed_default_data('<user-uuid>');

CREATE OR REPLACE FUNCTION public.seed_default_data(p_user_id uuid)
RETURNS void AS $$
DECLARE
  v_cat_bank_accounts    uuid;
  v_cat_ewallets         uuid;
  v_cat_cash_management  uuid;
  v_cat_investments      uuid;
  v_cat_retirement       uuid;
  v_cat_gold_commodities uuid;
  v_cat_crypto           uuid;
  v_cat_liabilities      uuid;
  v_cat_income           uuid;
BEGIN
  -- -------------------------------------------------------
  -- 1. Account Categories
  -- -------------------------------------------------------

  INSERT INTO public.account_categories (user_id, name, type, sort_order)
  VALUES (p_user_id, 'Bank Accounts', 'asset', 1)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_cat_bank_accounts;

  IF v_cat_bank_accounts IS NULL THEN
    SELECT id INTO v_cat_bank_accounts
    FROM public.account_categories
    WHERE user_id = p_user_id AND name = 'Bank Accounts';
  END IF;

  INSERT INTO public.account_categories (user_id, name, type, sort_order)
  VALUES (p_user_id, 'E-Wallets', 'asset', 2)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_cat_ewallets;

  IF v_cat_ewallets IS NULL THEN
    SELECT id INTO v_cat_ewallets
    FROM public.account_categories
    WHERE user_id = p_user_id AND name = 'E-Wallets';
  END IF;

  INSERT INTO public.account_categories (user_id, name, type, sort_order)
  VALUES (p_user_id, 'Cash Management', 'asset', 3)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_cat_cash_management;

  IF v_cat_cash_management IS NULL THEN
    SELECT id INTO v_cat_cash_management
    FROM public.account_categories
    WHERE user_id = p_user_id AND name = 'Cash Management';
  END IF;

  INSERT INTO public.account_categories (user_id, name, type, sort_order)
  VALUES (p_user_id, 'Investments', 'asset', 4)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_cat_investments;

  IF v_cat_investments IS NULL THEN
    SELECT id INTO v_cat_investments
    FROM public.account_categories
    WHERE user_id = p_user_id AND name = 'Investments';
  END IF;

  INSERT INTO public.account_categories (user_id, name, type, sort_order)
  VALUES (p_user_id, 'Retirement', 'asset', 5)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_cat_retirement;

  IF v_cat_retirement IS NULL THEN
    SELECT id INTO v_cat_retirement
    FROM public.account_categories
    WHERE user_id = p_user_id AND name = 'Retirement';
  END IF;

  INSERT INTO public.account_categories (user_id, name, type, sort_order)
  VALUES (p_user_id, 'Gold & Commodities', 'asset', 6)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_cat_gold_commodities;

  IF v_cat_gold_commodities IS NULL THEN
    SELECT id INTO v_cat_gold_commodities
    FROM public.account_categories
    WHERE user_id = p_user_id AND name = 'Gold & Commodities';
  END IF;

  INSERT INTO public.account_categories (user_id, name, type, sort_order)
  VALUES (p_user_id, 'Crypto', 'asset', 7)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_cat_crypto;

  IF v_cat_crypto IS NULL THEN
    SELECT id INTO v_cat_crypto
    FROM public.account_categories
    WHERE user_id = p_user_id AND name = 'Crypto';
  END IF;

  INSERT INTO public.account_categories (user_id, name, type, sort_order)
  VALUES (p_user_id, 'Liabilities', 'liability', 8)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_cat_liabilities;

  IF v_cat_liabilities IS NULL THEN
    SELECT id INTO v_cat_liabilities
    FROM public.account_categories
    WHERE user_id = p_user_id AND name = 'Liabilities';
  END IF;

  INSERT INTO public.account_categories (user_id, name, type, sort_order)
  VALUES (p_user_id, 'Income', 'income', 9)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_cat_income;

  IF v_cat_income IS NULL THEN
    SELECT id INTO v_cat_income
    FROM public.account_categories
    WHERE user_id = p_user_id AND name = 'Income';
  END IF;

  -- -------------------------------------------------------
  -- 2. Accounts
  -- -------------------------------------------------------

  -- Bank Accounts
  INSERT INTO public.accounts (user_id, category_id, name, type)
  VALUES
    (p_user_id, v_cat_bank_accounts, 'Maybank',        'bank'),
    (p_user_id, v_cat_bank_accounts, 'CIMB',           'bank'),
    (p_user_id, v_cat_bank_accounts, 'Maybank Zest-i', 'bank'),
    (p_user_id, v_cat_bank_accounts, 'MAE',            'bank'),
    (p_user_id, v_cat_bank_accounts, 'Kaf Bank',       'bank')
  ON CONFLICT DO NOTHING;

  -- E-Wallets
  INSERT INTO public.accounts (user_id, category_id, name, type)
  VALUES
    (p_user_id, v_cat_ewallets, 'TNG+', 'ewallet')
  ON CONFLICT DO NOTHING;

  -- Cash Management
  INSERT INTO public.accounts (user_id, category_id, name, type)
  VALUES
    (p_user_id, v_cat_cash_management, 'Versa Cash i', 'cash')
  ON CONFLICT DO NOTHING;

  -- Investments
  INSERT INTO public.accounts (user_id, category_id, name, type)
  VALUES
    (p_user_id, v_cat_investments, 'ASB',               'investment'),
    (p_user_id, v_cat_investments, 'Wahed Invest',      'investment'),
    (p_user_id, v_cat_investments, 'MooMoo',            'investment'),
    (p_user_id, v_cat_investments, 'Webull MoneyBull',  'investment'),
    (p_user_id, v_cat_investments, 'Luno',              'crypto')
  ON CONFLICT DO NOTHING;

  -- Retirement
  INSERT INTO public.accounts (user_id, category_id, name, type, is_locked_fund)
  VALUES
    (p_user_id, v_cat_retirement, 'KWSP', 'retirement', true)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.accounts (user_id, category_id, name, type)
  VALUES
    (p_user_id, v_cat_retirement, 'AHB', 'retirement')
  ON CONFLICT DO NOTHING;

  -- Gold & Commodities
  INSERT INTO public.accounts (user_id, category_id, name, type)
  VALUES
    (p_user_id, v_cat_gold_commodities, 'Versa Gold', 'gold')
  ON CONFLICT DO NOTHING;

  -- Liabilities
  INSERT INTO public.accounts (user_id, category_id, name, type)
  VALUES
    (p_user_id, v_cat_liabilities, 'Maybank Gold 2 Amex',       'liability'),
    (p_user_id, v_cat_liabilities, 'Maybank Gold 2 Mastercard', 'liability')
  ON CONFLICT DO NOTHING;

  -- Income
  INSERT INTO public.accounts (user_id, category_id, name, type)
  VALUES
    (p_user_id, v_cat_income, 'Salary',    'income'),
    (p_user_id, v_cat_income, 'Freelance', 'income'),
    (p_user_id, v_cat_income, 'Dividends', 'income')
  ON CONFLICT DO NOTHING;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
