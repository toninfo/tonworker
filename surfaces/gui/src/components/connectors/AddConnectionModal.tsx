import { useEffect, useState } from "react";
import { connectConnector, type Connector } from "../../api";
import { ConnectorBadge } from "../../connectors/ConnectorIcon";
import { useI18n } from "../../i18n/react";
import { ConnectSetup } from "../ManageTabs";
import { PILL_LINE } from "./ui";

// The ONE place a connection gets added (UX-DECISIONS §21): the detail page's header
// button (or the list's Connect pill) opens this sheet. Manual token / field paste only —
// managed one-click OAuth is retired (backend managed=False; connect-managed always fails).

const INPUT =
  "w-full px-3 py-2 rounded-lg border border-line bg-paper text-[13px] text-ink outline-none focus:border-accent";

export function AddConnectionModal({
  c,
  title,
  onClose,
  onChanged,
}: {
  c: Connector;
  title?: string; // e.g. "Add a workspace" — defaults to "Connect {title}"
  onClose: () => void;
  onChanged: () => void;
}) {
  const { t } = useI18n();
  const heading = title || t("Connect {name}", { name: c.title });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40" data-testid="add-connection-modal">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div
        className="absolute left-1/2 top-[14%] -translate-x-1/2 w-[480px] max-w-[calc(100vw-2rem)] bg-panel rounded-2xl border border-line shadow-2xl"
        role="dialog"
        aria-label={heading}
      >
        <div className="flex items-center gap-3 px-5 pt-5">
          <ConnectorBadge connector={c} size={34} title={c.title} />
          <div className="flex-1 font-semibold text-[16px] tracking-tight">{heading}</div>
          <button
            className="text-faint hover:text-ink text-[18px] leading-none"
            onClick={onClose}
            title={t("Close")}
          >
            ×
          </button>
        </div>

        {c.name === "slack" ? (
          <SlackManual
            onConnected={() => {
              onChanged();
              onClose();
            }}
          />
        ) : (
          <div className="px-1.5 pb-2">
            <ConnectSetup
              c={c}
              onConnected={() => {
                onChanged();
                onClose();
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function SlackManual({ onConnected }: { onConnected: () => void }) {
  const { t } = useI18n();
  const [bot, setBot] = useState("");
  const [app, setApp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async () => {
    setBusy(true);
    setError(null);
    const res = await connectConnector("slack", { bot_token: bot.trim(), app_token: app.trim() });
    setBusy(false);
    if (res.ok) onConnected();
    else setError(res.error || t("could not connect"));
  };
  return (
    <div className="px-5 py-4 space-y-3">
      <ol className="list-decimal pl-4 text-[13px] text-muted space-y-1">
        <li>{t("Create an app at api.slack.com/apps")}</li>
        <li>{t("Enable Socket Mode, add bot scopes, install it to your workspace")}</li>
        <li>{t("Paste both tokens")}</li>
      </ol>
      <input
        className={INPUT}
        type="password"
        placeholder={t("Bot token · xoxb-…")}
        value={bot}
        spellCheck={false}
        onChange={(e) => setBot(e.target.value)}
      />
      <input
        className={INPUT}
        type="password"
        placeholder={t("App token · xapp-…")}
        value={app}
        spellCheck={false}
        onChange={(e) => setApp(e.target.value)}
      />
      <button
        className={PILL_LINE + " w-full !py-2"}
        onClick={submit}
        disabled={busy || !bot.trim() || !app.trim()}
      >
        {busy ? t("Validating…") : t("Connect")}
      </button>
      {error && <div className="text-[12.5px] text-danger">{error}</div>}
    </div>
  );
}
