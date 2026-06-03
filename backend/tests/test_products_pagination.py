"""Product list pagination validation."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_products_rejects_skip_above_max(client: AsyncClient):
    response = await client.get(
        "/api/v1/products/",
        params={"skip": 1823754364766470537216, "category_id": 2},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_search_products_rejects_skip_above_max(client: AsyncClient):
    response = await client.get(
        "/api/v1/products/search",
        params={"q": "oil", "skip": 999_999},
    )
    assert response.status_code == 422
