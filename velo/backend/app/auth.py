import asyncio
import logging

from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.database import supabase_client
from app.models.schemas import UserContext

logger = logging.getLogger(__name__)

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
) -> UserContext:
    token = credentials.credentials
    try:
        response = await asyncio.to_thread(supabase_client().auth.get_user, token)
        if not response.user:
            raise HTTPException(status_code=401, detail="Token inválido")
        return UserContext(id=str(response.user.id), email=response.user.email)
    except HTTPException:
        raise
    except Exception as e:
        logger.warning("Auth error: %s: %s", type(e).__name__, e)
        raise HTTPException(status_code=401, detail="Token inválido ou expirado")


async def get_user_organization_id(user: UserContext) -> str:
    result = await asyncio.to_thread(
        lambda: supabase_client()
        .table("user_organizations")
        .select("organization_id")
        .eq("user_id", user.id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Organização não encontrada")
    return result.data["organization_id"]


async def require_brand_access(brand_id: str, user: UserContext) -> str:
    """Valida que o brand pertence à organização do usuário. Retorna o org_id."""
    org_id = await get_user_organization_id(user)
    result = await asyncio.to_thread(
        lambda: supabase_client()
        .table("brands")
        .select("id")
        .eq("id", brand_id)
        .eq("organization_id", org_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Marca não encontrada")
    return org_id
