"""TonWorker Cloud client — DISABLED in this fork.

This build ships **without** cloud sign-in, managed OAuth broker, Slack/GitHub
message relay, cloud telemetry, or the cloud Persona Gallery.

Manual connector credentials (pasted tokens / Socket Mode / PAT) and local MCP
OAuth remain available elsewhere in the codebase. Every public entry point here
is a hard no-op so nothing phones home to api.tonworker.local / Auth0 / the
relay WebSocket.
"""

from __future__ import annotations

import time
from typing import Any, Optional

from .config import Config
from .secrets import SecretStore

CLOUD_AUTH_PROFILE = "cloud:auth"
TELEMETRY_PROFILE = "cloud:telemetry"
LOGIN_SCOPES = "openid profile email offline_access"

# Kept for import compatibility with setup/list code that maps connector → broker key.
PROVIDER_FOR_CONNECTOR = {
    "gmail": "google",
    "google_calendar": "google",
    "google_drive": "google",
    "slack": "slack",
    "notion": "notion",
    "attio": "attio",
    "hubspot": "hubspot",
    "github": "github",
    "outlook": "microsoft",
}

_ERR = "TonWorker Cloud / managed OAuth / message relay are not available in this build"


def _now() -> float:
    """Retained so older tests can monkeypatch expiry math; unused by stubs."""
    return time.time()


def _fail(**extra: Any) -> dict[str, Any]:
    return {"ok": False, "error": _ERR, "removed": True, **extra}


# --- sign-in -----------------------------------------------------------------


def begin_login(config: Config) -> dict[str, Any]:
    return _fail(signed_in=False)


def complete_login(
    secrets: SecretStore, config: Config, code: str, state: str
) -> dict[str, Any]:
    return _fail(signed_in=False)


def sync_connections(secrets: SecretStore, config: Config) -> dict[str, Any]:
    return {"ok": True, "restored": [], "removed": True}


def status(secrets: SecretStore) -> dict[str, Any]:
    # Never report a cloud session — even if an old cloud:auth profile lingers on disk.
    return {
        "signed_in": False,
        "account": "",
        "user_id": "",
        "removed": True,
    }


def logout(secrets: SecretStore) -> dict[str, Any]:
    secrets.delete(CLOUD_AUTH_PROFILE)
    return {"ok": True, "signed_in": False, "removed": True}


def fresh_access_token(secrets: SecretStore, config: Config) -> Optional[str]:
    return None


def fetch_me(secrets: SecretStore, config: Config) -> Optional[dict]:
    return None


# --- telemetry ----------------------------------------------------------------


def install_id(secrets: SecretStore) -> str:
    return ""


def telemetry_enabled(secrets: SecretStore) -> bool:
    return False


def set_telemetry_enabled(secrets: SecretStore, enabled: bool) -> dict[str, Any]:
    return {"ok": True, "enabled": False, "removed": True}


def emit_session_created(
    secrets: SecretStore,
    config: Config,
    *,
    session_id: str = "",
    persona_id: str = "",
    persona_family: str = "",
    workspace_kind: str = "",
    **_: Any,
) -> bool:
    return False


# --- managed OAuth ------------------------------------------------------------


def begin_managed_connect(
    secrets: SecretStore,
    config: Config,
    connector: str,
    access: str = "",
    flow: str = "",
) -> dict[str, Any]:
    return _fail(signed_in=False, connector=connector)


def consume_managed_state(state: str) -> bool:
    return False


def managed_profile_from_callback(form: dict[str, str]) -> dict[str, Any]:
    return _fail()


def refresh_managed_token(
    secrets: SecretStore,
    config: Config,
    connector: str,
    *,
    profile_key: Optional[str] = None,
) -> Optional[dict[str, Any]]:
    return None


def ensure_fresh_connector_token(
    secrets: SecretStore,
    config: Config,
    connector: str,
    *,
    profile_key: Optional[str] = None,
    leeway: int = 120,
) -> None:
    return None


def cloud_disconnect(
    secrets: SecretStore,
    config: Config,
    connector: str,
    *,
    profile_key: Optional[str] = None,
    **_: Any,
) -> None:
    return None


# --- GitHub / Slack relay helpers --------------------------------------------


def github_installation_token(
    secrets: SecretStore,
    config: Config,
    installation_id: str,
    *,
    force: bool = False,
    **_: Any,
) -> str:
    return ""


def clear_github_token(installation_id: str) -> None:
    return None


def github_disconnect_installation(
    secrets: SecretStore,
    config: Config,
    installation_id: str,
    **_: Any,
) -> None:
    return None


def slack_disconnect_workspace(
    secrets: SecretStore,
    config: Config,
    team_id: str,
    **_: Any,
) -> None:
    return None


# --- gallery ------------------------------------------------------------------


def gallery_list(secrets: SecretStore, config: Config) -> Optional[dict]:
    return None


def gallery_manifest(secrets: SecretStore, config: Config, slug: str) -> Optional[dict]:
    return None


def gallery_install_event(secrets: SecretStore, config: Config, slug: str) -> None:
    return None


def gallery_detail(secrets: SecretStore, config: Config, slug: str) -> Optional[dict]:
    return None
