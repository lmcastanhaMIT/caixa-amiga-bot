
-- 1. Create households table
CREATE TABLE public.households (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Minha Carteira',
  owner_user_id uuid NOT NULL,
  invite_code text UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;

-- 2. Create household_members table
CREATE TABLE public.household_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  status text NOT NULL DEFAULT 'active',
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(household_id, user_id)
);
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;

-- 3. Add household_id and created_by_user_id to existing tables
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS household_id uuid REFERENCES public.households(id);
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS created_by_user_id uuid;

ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS household_id uuid REFERENCES public.households(id);
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS household_id uuid REFERENCES public.households(id);

-- 4. Security definer functions for RLS
CREATE OR REPLACE FUNCTION public.is_household_member(_user_id uuid, _household_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.household_members
    WHERE user_id = _user_id AND household_id = _household_id AND status = 'active'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_household_owner(_user_id uuid, _household_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.household_members
    WHERE user_id = _user_id AND household_id = _household_id AND role = 'owner' AND status = 'active'
  )
$$;

-- 5. Function to join household by invite code
CREATE OR REPLACE FUNCTION public.join_household_by_code(_invite_code text)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _hh_id uuid;
  _hh_name text;
BEGIN
  SELECT id, name INTO _hh_id, _hh_name FROM public.households WHERE invite_code = _invite_code;
  IF _hh_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Código de convite inválido');
  END IF;
  IF EXISTS (SELECT 1 FROM public.household_members WHERE household_id = _hh_id AND user_id = auth.uid()) THEN
    RETURN json_build_object('success', false, 'error', 'Você já é membro desta carteira');
  END IF;
  INSERT INTO public.household_members (household_id, user_id, role, status)
  VALUES (_hh_id, auth.uid(), 'member', 'active');
  RETURN json_build_object('success', true, 'household_id', _hh_id, 'household_name', _hh_name);
END;
$$;

-- 6. RLS for households
CREATE POLICY "Members can view their households"
ON public.households FOR SELECT
USING (public.is_household_member(auth.uid(), id));

CREATE POLICY "Users can create households"
ON public.households FOR INSERT
WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Owners can update households"
ON public.households FOR UPDATE
USING (auth.uid() = owner_user_id);

-- 7. RLS for household_members
CREATE POLICY "Members can view household members"
ON public.household_members FOR SELECT
USING (public.is_household_member(auth.uid(), household_id));

CREATE POLICY "Owner or self can insert members"
ON public.household_members FOR INSERT
WITH CHECK (
  public.is_household_owner(auth.uid(), household_id) OR auth.uid() = user_id
);

CREATE POLICY "Owners can update members"
ON public.household_members FOR UPDATE
USING (public.is_household_owner(auth.uid(), household_id));

CREATE POLICY "Owners can remove members"
ON public.household_members FOR DELETE
USING (public.is_household_owner(auth.uid(), household_id));

-- 8. Update transactions RLS
DROP POLICY IF EXISTS "Users manage own transactions" ON public.transactions;

CREATE POLICY "View transactions"
ON public.transactions FOR SELECT
USING (
  auth.uid() = user_id
  OR (household_id IS NOT NULL AND public.is_household_member(auth.uid(), household_id))
);

CREATE POLICY "Insert transactions"
ON public.transactions FOR INSERT
WITH CHECK (
  auth.uid() = user_id
);

CREATE POLICY "Update transactions"
ON public.transactions FOR UPDATE
USING (
  auth.uid() = user_id
  OR (household_id IS NOT NULL AND public.is_household_owner(auth.uid(), household_id))
);

CREATE POLICY "Delete transactions"
ON public.transactions FOR DELETE
USING (
  auth.uid() = user_id
  OR (household_id IS NOT NULL AND public.is_household_owner(auth.uid(), household_id))
);

-- 9. Update goals RLS
DROP POLICY IF EXISTS "Users manage own goals" ON public.goals;

CREATE POLICY "View goals"
ON public.goals FOR SELECT
USING (
  auth.uid() = user_id
  OR (household_id IS NOT NULL AND public.is_household_member(auth.uid(), household_id))
);

CREATE POLICY "Insert goals"
ON public.goals FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Update goals"
ON public.goals FOR UPDATE
USING (
  auth.uid() = user_id
  OR (household_id IS NOT NULL AND public.is_household_owner(auth.uid(), household_id))
);

CREATE POLICY "Delete goals"
ON public.goals FOR DELETE
USING (
  auth.uid() = user_id
  OR (household_id IS NOT NULL AND public.is_household_owner(auth.uid(), household_id))
);

-- 10. Update budgets RLS
DROP POLICY IF EXISTS "Users manage own budgets" ON public.budgets;

CREATE POLICY "View budgets"
ON public.budgets FOR SELECT
USING (
  auth.uid() = user_id
  OR (household_id IS NOT NULL AND public.is_household_member(auth.uid(), household_id))
);

CREATE POLICY "Insert budgets"
ON public.budgets FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Update budgets"
ON public.budgets FOR UPDATE
USING (
  auth.uid() = user_id
  OR (household_id IS NOT NULL AND public.is_household_owner(auth.uid(), household_id))
);

CREATE POLICY "Delete budgets"
ON public.budgets FOR DELETE
USING (
  auth.uid() = user_id
  OR (household_id IS NOT NULL AND public.is_household_owner(auth.uid(), household_id))
);

-- 11. Migrate existing users: create personal household for each
DO $$
DECLARE
  r RECORD;
  hh_id uuid;
BEGIN
  FOR r IN (
    SELECT DISTINCT user_id FROM (
      SELECT user_id FROM public.transactions
      UNION SELECT user_id FROM public.goals
      UNION SELECT user_id FROM public.budgets
    ) all_users
  ) LOOP
    INSERT INTO public.households (name, owner_user_id)
    VALUES ('Minha Carteira', r.user_id)
    RETURNING id INTO hh_id;

    INSERT INTO public.household_members (household_id, user_id, role, status)
    VALUES (hh_id, r.user_id, 'owner', 'active');

    UPDATE public.transactions SET household_id = hh_id, created_by_user_id = user_id WHERE user_id = r.user_id AND household_id IS NULL;
    UPDATE public.goals SET household_id = hh_id WHERE user_id = r.user_id AND household_id IS NULL;
    UPDATE public.budgets SET household_id = hh_id WHERE user_id = r.user_id AND household_id IS NULL;
  END LOOP;
END $$;

-- 12. Trigger to auto-create household for new users on first transaction
CREATE OR REPLACE FUNCTION public.ensure_user_household()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  hh_id uuid;
BEGIN
  IF NEW.household_id IS NULL THEN
    SELECT hm.household_id INTO hh_id
    FROM public.household_members hm
    WHERE hm.user_id = NEW.user_id AND hm.status = 'active'
    LIMIT 1;

    IF hh_id IS NULL THEN
      INSERT INTO public.households (name, owner_user_id)
      VALUES ('Minha Carteira', NEW.user_id)
      RETURNING id INTO hh_id;

      INSERT INTO public.household_members (household_id, user_id, role, status)
      VALUES (hh_id, NEW.user_id, 'owner', 'active');
    END IF;

    NEW.household_id := hh_id;
  END IF;

  IF TG_TABLE_NAME = 'transactions' AND NEW.created_by_user_id IS NULL THEN
    NEW.created_by_user_id := NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER ensure_transaction_household
BEFORE INSERT ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.ensure_user_household();

CREATE TRIGGER ensure_goal_household
BEFORE INSERT ON public.goals
FOR EACH ROW EXECUTE FUNCTION public.ensure_user_household();

CREATE TRIGGER ensure_budget_household
BEFORE INSERT ON public.budgets
FOR EACH ROW EXECUTE FUNCTION public.ensure_user_household();
