"""
Row Level Security (RLS) for Sikapa — PostgreSQL only.

Run after Alembic migrations:
    cd backend && python tools/rls/rls_setup.py

The API sets transaction-local GUC app.current_user_id from each request JWT
(see app/db.py). Policies below use app.current_uid() and app.is_admin().
Webhook / Paystack uses SECURITY DEFINER helper app.get_order_user_for_paystack.
"""

from __future__ import annotations

import os
import sys

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("DATABASE_URL not found in environment variables")
    sys.exit(1)

if not DATABASE_URL.startswith("postgresql"):
    print("RLS setup is for PostgreSQL only; skipping.")
    sys.exit(0)


TABLES = [
    "product",
    "category",
    "cartitem",
    "wishlistitem",
    "productimage",
    "emailsubscription",
    "review",
    "orderitem",
    "invoice",
    "paystack_init_idempotency",
    "paystack_transaction",
    "tokenblacklist",
    "otpcode",
    "twofactorsecret",
    "passwordreset",
    "adminauditlog",
    '"user"',
    '"order"',
]


def _drop_existing_policies(conn) -> None:
    conn.execute(
        text(
            """
            DO $drop$
            DECLARE
              r record;
            BEGIN
              FOR r IN
                SELECT schemaname, tablename, policyname
                FROM pg_policies
                WHERE schemaname = 'public'
                  AND tablename IN (
                    'product','category','cartitem','wishlistitem','productimage',
                    'emailsubscription','review','orderitem','invoice',
                    'paystack_init_idempotency','paystack_transaction',
                    'tokenblacklist','otpcode','twofactorsecret','passwordreset',
                    'adminauditlog','user','order'
                  )
              LOOP
                EXECUTE format(
                  'DROP POLICY IF EXISTS %I ON %I.%I',
                  r.policyname, r.schemaname, r.tablename
                );
              END LOOP;
            END
            $drop$;
            """
        )
    )


def setup_rls_policies() -> None:
    engine = create_engine(DATABASE_URL, echo=False)

    ddl = [
        "CREATE SCHEMA IF NOT EXISTS app;",
        """
        CREATE OR REPLACE FUNCTION app.current_uid() RETURNS integer AS $$
        DECLARE
          v text;
        BEGIN
          v := current_setting('app.current_user_id', true);
          IF v IS NULL OR btrim(v) = '' THEN
            RETURN NULL;
          END IF;
          RETURN v::integer;
        EXCEPTION
          WHEN OTHERS THEN
            RETURN NULL;
        END;
        $$ LANGUAGE plpgsql STABLE;
        """,
        """
        CREATE OR REPLACE FUNCTION app.is_admin() RETURNS boolean AS $$
        DECLARE
          v integer;
          adm boolean;
        BEGIN
          v := app.current_uid();
          IF v IS NULL THEN
            RETURN false;
          END IF;
          SELECT u.is_admin INTO adm FROM "user" u WHERE u.id = v;
          RETURN COALESCE(adm, false);
        END;
        $$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;
        """,
        """
        CREATE OR REPLACE FUNCTION app.get_order_user_for_paystack(p_ref text)
        RETURNS integer AS $$
          SELECT user_id FROM "order" WHERE paystack_reference = p_ref LIMIT 1;
        $$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;
        """,
        "DROP FUNCTION IF EXISTS app.bypass_rls();",
    ]

    policies = [
        # Catalog
        "CREATE POLICY p_product_select_public ON product FOR SELECT USING (true);",
        """CREATE POLICY p_product_ins_admin ON product FOR INSERT
           WITH CHECK (app.is_admin());""",
        """CREATE POLICY p_product_upd_admin ON product FOR UPDATE
           USING (app.is_admin()) WITH CHECK (app.is_admin());""",
        """CREATE POLICY p_product_del_admin ON product FOR DELETE
           USING (app.is_admin());""",
        "CREATE POLICY p_category_select_public ON category FOR SELECT USING (true);",
        """CREATE POLICY p_category_ins_admin ON category FOR INSERT
           WITH CHECK (app.is_admin());""",
        """CREATE POLICY p_category_upd_admin ON category FOR UPDATE
           USING (app.is_admin()) WITH CHECK (app.is_admin());""",
        """CREATE POLICY p_category_del_admin ON category FOR DELETE
           USING (app.is_admin());""",
        "CREATE POLICY p_productimage_select_public ON productimage FOR SELECT USING (true);",
        """CREATE POLICY p_productimage_ins_admin ON productimage FOR INSERT
           WITH CHECK (app.is_admin());""",
        """CREATE POLICY p_productimage_upd_admin ON productimage FOR UPDATE
           USING (app.is_admin()) WITH CHECK (app.is_admin());""",
        """CREATE POLICY p_productimage_del_admin ON productimage FOR DELETE
           USING (app.is_admin());""",
        # Reviews
        "CREATE POLICY p_review_select_public ON review FOR SELECT USING (true);",
        """CREATE POLICY p_review_ins ON review FOR INSERT
           WITH CHECK (user_id = app.current_uid() OR app.is_admin());""",
        """CREATE POLICY p_review_upd ON review FOR UPDATE
           USING (user_id = app.current_uid() OR app.is_admin())
           WITH CHECK (user_id = app.current_uid() OR app.is_admin());""",
        """CREATE POLICY p_review_del ON review FOR DELETE
           USING (user_id = app.current_uid() OR app.is_admin());""",
        # user: anon may read all rows (login/lookup); authenticated non-admin only self
        """CREATE POLICY p_user_select ON "user" FOR SELECT USING (
           app.current_uid() IS NULL OR id = app.current_uid() OR app.is_admin()
        );""",
        """CREATE POLICY p_user_ins ON "user" FOR INSERT WITH CHECK (
           app.current_uid() IS NULL OR app.is_admin()
        );""",
        """CREATE POLICY p_user_upd ON "user" FOR UPDATE
           USING (id = app.current_uid() OR app.is_admin())
           WITH CHECK (id = app.current_uid() OR app.is_admin());""",
        """CREATE POLICY p_user_del ON "user" FOR DELETE USING (app.is_admin());""",
        # orders
        """CREATE POLICY p_order_all ON "order" FOR ALL
           USING (user_id = app.current_uid() OR app.is_admin())
           WITH CHECK (user_id = app.current_uid() OR app.is_admin());""",
        """CREATE POLICY p_orderitem_all ON orderitem FOR ALL
           USING (
             EXISTS (
               SELECT 1 FROM "order" o
               WHERE o.id = orderitem.order_id
               AND (o.user_id = app.current_uid() OR app.is_admin())
             )
           )
           WITH CHECK (
             EXISTS (
               SELECT 1 FROM "order" o
               WHERE o.id = orderitem.order_id
               AND (o.user_id = app.current_uid() OR app.is_admin())
             )
           );""",
        """CREATE POLICY p_invoice_all ON invoice FOR ALL
           USING (
             EXISTS (
               SELECT 1 FROM "order" o
               WHERE o.id = invoice.order_id
               AND (o.user_id = app.current_uid() OR app.is_admin())
             )
           )
           WITH CHECK (
             EXISTS (
               SELECT 1 FROM "order" o
               WHERE o.id = invoice.order_id
               AND (o.user_id = app.current_uid() OR app.is_admin())
             )
           );""",
        # cart / wishlist / paystack rows
        """CREATE POLICY p_cartitem_all ON cartitem FOR ALL
           USING (user_id = app.current_uid() OR app.is_admin())
           WITH CHECK (user_id = app.current_uid() OR app.is_admin());""",
        """CREATE POLICY p_wishlist_all ON wishlistitem FOR ALL
           USING (user_id = app.current_uid() OR app.is_admin())
           WITH CHECK (user_id = app.current_uid() OR app.is_admin());""",
        """CREATE POLICY p_paystack_init_all ON paystack_init_idempotency FOR ALL
           USING (user_id = app.current_uid() OR app.is_admin())
           WITH CHECK (user_id = app.current_uid() OR app.is_admin());""",
        """CREATE POLICY p_paystack_tx_all ON paystack_transaction FOR ALL
           USING (user_id = app.current_uid() OR app.is_admin())
           WITH CHECK (user_id = app.current_uid() OR app.is_admin());""",
        # Auth/supporting tables
        """CREATE POLICY p_tokenblacklist_all ON tokenblacklist FOR ALL
           USING (user_id = app.current_uid() OR app.is_admin())
           WITH CHECK (user_id = app.current_uid() OR app.is_admin());""",
        """CREATE POLICY p_otp_all ON otpcode FOR ALL
           USING (user_id = app.current_uid() OR app.is_admin())
           WITH CHECK (user_id = app.current_uid() OR app.is_admin());""",
        """CREATE POLICY p_twofactor_all ON twofactorsecret FOR ALL
           USING (user_id = app.current_uid() OR app.is_admin())
           WITH CHECK (user_id = app.current_uid() OR app.is_admin());""",
        # Password reset: lookup by token is unauthenticated (token is secret)
        "CREATE POLICY p_pwdreset_select ON passwordreset FOR SELECT USING (true);",
        """CREATE POLICY p_pwdreset_ins ON passwordreset FOR INSERT
           WITH CHECK (user_id = app.current_uid() OR app.is_admin());""",
        """CREATE POLICY p_pwdreset_upd ON passwordreset FOR UPDATE
           USING (user_id = app.current_uid() OR app.is_admin())
           WITH CHECK (user_id = app.current_uid() OR app.is_admin());""",
        """CREATE POLICY p_pwdreset_del ON passwordreset FOR DELETE
           USING (app.is_admin());""",
        # Newsletter (public subscribe/unsubscribe looks up by email; API enforces abuse limits)
        "CREATE POLICY p_emailsub_sel ON emailsubscription FOR SELECT USING (true);",
        """CREATE POLICY p_emailsub_ins ON emailsubscription FOR INSERT
           WITH CHECK (user_id IS NULL OR user_id = app.current_uid() OR app.is_admin());""",
        """CREATE POLICY p_emailsub_upd ON emailsubscription FOR UPDATE
           USING (user_id = app.current_uid() OR app.is_admin())
           WITH CHECK (user_id = app.current_uid() OR app.is_admin());""",
        """CREATE POLICY p_emailsub_del ON emailsubscription FOR DELETE
           USING (user_id = app.current_uid() OR app.is_admin());""",
        # Admin audit
        """CREATE POLICY p_audit_all ON adminauditlog FOR ALL
           USING (app.is_admin()) WITH CHECK (app.is_admin());""",
    ]

    enable_stmts = [f"ALTER TABLE {t} ENABLE ROW LEVEL SECURITY;" for t in TABLES]
    force_stmts = [f"ALTER TABLE {t} FORCE ROW LEVEL SECURITY;" for t in TABLES]

    with engine.begin() as conn:
        _drop_existing_policies(conn)
        for stmt in ddl:
            conn.execute(text(stmt))
        for stmt in enable_stmts:
            conn.execute(text(stmt))
        for stmt in policies:
            conn.execute(text(stmt.strip()))
        for stmt in force_stmts:
            conn.execute(text(stmt))

    print("RLS enabled (no bypass). Ensure app/db.py sets app.current_user_id per request.")


if __name__ == "__main__":
    setup_rls_policies()
    print("RLS setup complete.")
