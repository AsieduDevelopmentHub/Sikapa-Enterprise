-- Patch: allow customers to write their own audit rows (order_created, etc.)
-- while keeping reads admin-only. Run once on Supabase/Postgres production.
--
--   psql "$DATABASE_URL" -f backend/tools/rls/patch_audit_insert_policy.sql

DROP POLICY IF EXISTS p_audit_all ON auditlog;

DROP POLICY IF EXISTS p_audit_select ON auditlog;
CREATE POLICY p_audit_select ON auditlog FOR SELECT
  USING (app.is_admin());

DROP POLICY IF EXISTS p_audit_insert ON auditlog;
CREATE POLICY p_audit_insert ON auditlog FOR INSERT
  WITH CHECK (user_id = app.current_uid() OR app.is_admin());

DROP POLICY IF EXISTS p_audit_update ON auditlog;
CREATE POLICY p_audit_update ON auditlog FOR UPDATE
  USING (app.is_admin()) WITH CHECK (app.is_admin());

DROP POLICY IF EXISTS p_audit_delete ON auditlog;
CREATE POLICY p_audit_delete ON auditlog FOR DELETE
  USING (app.is_admin());
