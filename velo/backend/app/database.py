from supabase import create_client, Client
from app.config import settings

_supabase: Client | None = None


def get_supabase() -> Client:
    """Returns a Supabase client using the service role key.
    Called lazily — no module-level instantiation.
    """
    return create_client(settings.supabase_url, settings.supabase_service_key)


def supabase_client() -> Client:
    """Lazy singleton for non-FastAPI use (worker, scripts).
    Tests can override _supabase directly via patch('app.database._supabase', ...).
    """
    global _supabase
    if _supabase is None:
        _supabase = get_supabase()
    return _supabase
