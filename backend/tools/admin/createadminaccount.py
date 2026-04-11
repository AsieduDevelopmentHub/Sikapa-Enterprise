"""Create an admin account for the Sikapa backend."""
import argparse
import getpass
from dotenv import load_dotenv

from sqlmodel import Session
from app.db import engine, create_db_and_tables
from app.api.v1.auth.services import register_user
from app.models import User

load_dotenv()


def create_admin_account(email: str, password: str, first_name: str | None, last_name: str | None) -> User:
    """Create or promote an admin user."""
    create_db_and_tables()

    from sqlmodel import select

    with Session(engine) as session:
        existing = session.exec(select(User).where(User.email == email)).first() if email else None
        if existing:
            existing.is_admin = True
            existing.is_active = True
            existing.email_verified = True
            if first_name:
                existing.first_name = first_name
            if last_name:
                existing.last_name = last_name
            session.add(existing)
            session.commit()
            session.refresh(existing)
            return existing

        user = register_user(session, email, password, first_name=first_name, last_name=last_name)
        user.is_admin = True
        user.is_active = True
        user.email_verified = True
        session.add(user)
        session.commit()
        session.refresh(user)
        return user


def main() -> None:
    parser = argparse.ArgumentParser(description="Create a new admin account for Sikapa.")
    parser.add_argument("--email", help="Admin user email address.")
    parser.add_argument("--password", help="Admin user password.")
    parser.add_argument("--first-name", help="Admin first name.")
    parser.add_argument("--last-name", help="Admin last name.")
    args = parser.parse_args()

    email = args.email or input("Admin email: ").strip()
    password = args.password or getpass.getpass("Admin password: ")
    first_name = args.first_name or input("Admin first name (optional): ").strip() or None
    last_name = args.last_name or input("Admin last name (optional): ").strip() or None

    if not email or not password:
        raise SystemExit("Email and password are required to create an admin account.")

    admin = create_admin_account(email, password, first_name, last_name)
    print(f"Admin account created: {admin.email} (id={admin.id})")


if __name__ == "__main__":
    main()
