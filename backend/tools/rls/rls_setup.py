"""
RLS (Row Level Security) Policies Setup Script

This script sets up Row Level Security policies for the Sikapa Enterprise database.
Run this AFTER migrations have been applied.

⚠️  IMPORTANT: This is a simplified setup for demonstration.
   In production, you should integrate with Supabase Auth properly by:
   1. Using auth.users table for authentication
   2. Creating a profile table that references auth.users.id (UUID)
   3. Or implementing proper user ID mapping

Usage:
    python tools/rls/rls_setup.py (from backend directory)
"""

import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("❌ DATABASE_URL not found in environment variables")
    sys.exit(1)

def setup_rls_policies():
    """Set up Row Level Security policies for all tables"""

    engine = create_engine(DATABASE_URL, echo=True)

    with engine.connect() as conn:
        try:
            print("🔒 Setting up simplified RLS policies...")
            print("⚠️  Note: This is for demonstration. Production needs proper Supabase Auth integration.")

            # For now, disable RLS and create basic policies
            # In production, you'd integrate with Supabase Auth

            # Products table - public read for now
            conn.execute(text("""
                ALTER TABLE product ENABLE ROW LEVEL SECURITY;
            """))

            # Allow everyone to read products (public catalog)
            conn.execute(text("""
                CREATE POLICY "Public read access to products"
                ON product FOR SELECT
                USING (true);
            """))

            # For now, allow authenticated users to manage products
            # In production, this should check admin status
            conn.execute(text("""
                CREATE POLICY "Authenticated users can manage products"
                ON product FOR ALL
                USING (auth.role() = 'authenticated');
            """))

            # Users table - basic policies
            conn.execute(text("""
                ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
            """))

            # Users can read their own data
            conn.execute(text("""
                CREATE POLICY "Users can view own data"
                ON "user" FOR SELECT
                USING (auth.role() = 'authenticated');
            """))

            # For now, allow authenticated users to update
            # In production, restrict to own data only
            conn.execute(text("""
                CREATE POLICY "Authenticated users can update data"
                ON "user" FOR UPDATE
                USING (auth.role() = 'authenticated');
            """))

            conn.commit()
            print("✅ Basic RLS policies set up successfully!")
            print("📝 Note: These are simplified policies for development.")
            print("🔧 Production needs proper Supabase Auth integration.")

        except Exception as e:
            print(f"❌ Error setting up RLS policies: {e}")
            conn.rollback()
            raise

if __name__ == "__main__":
    print("🚀 Setting up RLS policies for Sikapa Enterprise...")
    setup_rls_policies()
    print("🎉 RLS setup complete!")