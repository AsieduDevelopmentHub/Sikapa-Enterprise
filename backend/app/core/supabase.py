"""
Supabase storage helper.
"""
import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
SUPABASE_STORAGE_BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET", "product-images")

_supabase_client: Client | None = None


def get_supabase_client() -> Client | None:
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return None

    _supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    # Ensure bucket exists
    try:
        _ensure_bucket_exists(_supabase_client)
    except Exception as e:
        print(f"Warning: Could not ensure bucket exists: {e}")
    
    return _supabase_client


def _ensure_bucket_exists(client: Client) -> None:
    """Create storage bucket if it doesn't exist."""
    try:
        # Try to get bucket info
        client.storage.get_bucket(SUPABASE_STORAGE_BUCKET)
    except Exception as e:
        # Bucket doesn't exist, try to create it
        if "not found" in str(e).lower():
            try:
                client.storage.create_bucket(
                    SUPABASE_STORAGE_BUCKET,
                    {
                        "public": True,
                        "allowed_mime_types": [
                            "image/jpeg",
                            "image/png",
                            "image/webp",
                            "image/gif",
                        ],
                    },
                )
                print(f"Created Supabase storage bucket: {SUPABASE_STORAGE_BUCKET}")
            except Exception as create_error:
                print(f"Could not create bucket {SUPABASE_STORAGE_BUCKET}: {create_error}")
                raise
        else:
            raise


def get_public_url(path: str) -> str | None:
    client = get_supabase_client()
    if not client:
        return None

    try:
        response = client.storage.from_(SUPABASE_STORAGE_BUCKET).get_public_url(path)
        if response and response.get("public_url"):
            return response["public_url"]
    except Exception as e:
        print(f"Error getting public URL: {e}")
    
    return None