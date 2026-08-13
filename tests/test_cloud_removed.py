"""This fork ships without TonWorker Cloud — stubs must stay hard-off."""

from pathlib import Path

from coworker import cloud
from coworker.config import load_config
from coworker.secrets import SecretStore


def test_cloud_status_always_signed_out(tmp_path: Path) -> None:
    secrets = SecretStore(tmp_path / "secrets.json")
    # Even with a leftover cloud:auth profile on disk…
    secrets.put(
        cloud.CLOUD_AUTH_PROFILE,
        {"access_token": "stale", "account": "x@y.z", "user_id": "u"},
    )
    st = cloud.status(secrets)
    assert st["signed_in"] is False
    assert st.get("removed") is True


def test_begin_login_and_managed_connect_rejected(tmp_path: Path) -> None:
    cfg = load_config()
    assert cfg.cloud_base_url == ""
    assert cfg.cloud_relay_ws_url == ""
    out = cloud.begin_login(cfg)
    assert out["ok"] is False
    secrets = SecretStore(tmp_path / "secrets.json")
    managed = cloud.begin_managed_connect(secrets, cfg, "slack")
    assert managed["ok"] is False


def test_connectors_are_not_managed() -> None:
    from coworker.connectors.descriptors import DESCRIPTORS

    for d in DESCRIPTORS:
        assert d.managed is False, d.name
