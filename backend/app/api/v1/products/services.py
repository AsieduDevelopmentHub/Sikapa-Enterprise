from typing import List

from fastapi import HTTPException
from sqlmodel import Session, select

from app.db import engine
from app.models import Product


def get_products() -> List[Product]:
    with Session(engine) as session:
        return session.exec(select(Product)).all()


def get_product_by_slug(slug: str) -> Product:
    with Session(engine) as session:
        product = session.exec(select(Product).where(Product.slug == slug)).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        return product


def create_product(product_data) -> Product:
    with Session(engine) as session:
        db_product = Product.from_orm(product_data)
        session.add(db_product)
        session.commit()
        session.refresh(db_product)
        return db_product