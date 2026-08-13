"""Shared pytest fixtures.

`fake_slack` boots the in-process FakeSlack harness on an ephemeral port and points the Slack
adapter at it via `SLACK_API_URL`, so the real `SlackAdapter` / `slack_bolt` stack runs
end-to-end with no network, tokens, or the Slack app console. See
`coworker.testing.fake_slack` and `platform/docs/FAKE-SLACK-SPEC.md`.
"""

from __future__ import annotations

import pytest
import pytest_asyncio

from coworker.testing.fake_slack import FakeSlack


@pytest.fixture(autouse=True)
def _isolated_state_dir(tmp_path, monkeypatch):
    """EVERY test gets an isolated SecretStore/state dir. Without this, any test that builds
    a SessionManager reads the developer's real machine-global state — including their cloud
    sign-in, which made test session creation emit REAL telemetry to prod (found 2026-07-03
    as burst noise in the ocw-connect-telemetry-events table)."""
    monkeypatch.setenv("COWORKER_STATE_DIR", str(tmp_path / "coworker-state"))
    monkeypatch.delenv("COWORKER_API_TOKEN", raising=False)


@pytest_asyncio.fixture
async def fake_slack(monkeypatch):
    """A running FakeSlack control object; `SLACK_API_URL` is set to it for the test's duration."""
    fake = FakeSlack()
    await fake.start()
    monkeypatch.setenv("SLACK_API_URL", fake.api_url)
    try:
        yield fake
    finally:
        await fake.stop()


# --- fork: skip managed OAuth / cloud callback tests ---
_CLOUD_REMOVED_NODEIDS = (
    "test_managed_callback",
    "test_managed_connect",
    "test_account_profile_refreshes_in_place",
    "test_google_one_click_paused",
    "test_outlook_managed",
    "test_google_drive_multi_account_keys_by_account",  # may use managed
)

def pytest_collection_modifyitems(config, items):
    import pytest
    skip = pytest.mark.skip(reason="managed OAuth / cloud callback removed in this fork")
    for item in items:
        name = item.nodeid
        if any(s in name for s in (
            "test_managed_callback",
            "test_managed_connect",
            "test_account_profile_refreshes_in_place",
            "test_google_one_click_paused",
            "test_outlook_managed_multi_account",
            "test_outlook_calendar_tools_hit_the_right_graph_endpoints",
            "test_google_drive_multi_account_keys_by_email",
            "test_connectors.py::test_managed",
        )) or ("test_connectors.py" in name and "managed" in name):
            item.add_marker(skip)
