import { useState } from "react";
import {
  disconnectGcalAccount,
  setGcalDefaultAccount,
  type GmailAccount,
} from "../../api";
import { ConnectorBadge } from "../../connectors/ConnectorIcon";
import { useI18n } from "../../i18n/react";
import { AddConnectionModal } from "./AddConnectionModal";
import type { DetailProps } from "./ConnectorsSection";
import { ToolsDisclosure } from "./ToolsDisclosure";
import { FOOT, GRP, GRP_H, PILL_ACCENT, ROW, TAG_ACCENT, TAG_WARN, XBTN } from "./ui";

// Google Calendar detail: multi-account list. Manual OAuth token connect only
// (managed one-click retired).

export function CalendarDetail({ c, onChanged }: DetailProps) {
  const { t } = useI18n();
  const [adding, setAdding] = useState(false);
  const accounts = (c.accounts ?? []) as GmailAccount[];

  return (
    <div data-testid="gcal-detail">
      <div className="flex items-center gap-3.5 mb-5">
        <ConnectorBadge connector={c} size={44} title="Google Calendar" />
        <div className="min-w-0 flex-1">
          <h2 className="text-[20px] font-semibold tracking-tight leading-tight">
            Google Calendar
          </h2>
          <div className="text-[12.5px] text-muted flex items-center gap-1.5">
            {c.connected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-ok" />
                <span data-testid="gcal-status">
                  {accounts.length === 1
                    ? t("{n} account", { n: accounts.length })
                    : t("{n} accounts", { n: accounts.length })}
                </span>
              </>
            ) : (
              <span>{t("Not connected")}</span>
            )}
          </div>
        </div>
        <button
          className={PILL_ACCENT}
          data-testid="add-account-btn"
          onClick={() => setAdding(true)}
        >
          {t("＋ Add account")}
        </button>
      </div>

      {!c.connected && (
        <div className={GRP}>
          <div className={ROW + " text-[12.5px] text-muted"}>
            {t("Sign in with Google — each account stays separate, agents say which one they use.")}
          </div>
        </div>
      )}

      {accounts.length > 0 && (
        <>
          <div className={GRP_H + " !mt-0"}>{t("Accounts")}</div>
          <div className={GRP} data-testid="gcal-accounts">
            {accounts.map((a) => (
              <AccountRow key={a.email} a={a} onChanged={onChanged} />
            ))}
          </div>
        </>
      )}

      <ToolsDisclosure c={c} onChanged={onChanged} />
      <div className={FOOT + " mt-2"}>
        {t(
          "Creating, changing, or deleting events always asks for your approval first, and the approval names the account.",
        )}
      </div>

      {adding && (
        <AddConnectionModal
          c={c}
          title={t("＋ Add account")}
          onClose={() => setAdding(false)}
          onChanged={onChanged}
        />
      )}
    </div>
  );
}

function AccountRow({ a, onChanged }: { a: GmailAccount; onChanged: () => void }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  return (
    <div className={ROW} data-testid={`gcal-account-${a.email}`}>
      <span className="min-w-0 flex-1 flex items-center gap-2">
        <span className="text-[13px] font-medium truncate">{a.email}</span>
        {a.default && <span className={TAG_ACCENT}>{t("Default")}</span>}
        {a.needs_reauth && <span className={TAG_WARN}>⚠ {t("Sign in again")}</span>}
      </span>
      {!a.default && (
        <button
          className="text-[12px] text-muted hover:text-ink shrink-0"
          data-testid={`gcal-make-default-${a.email}`}
          onClick={async () => {
            await setGcalDefaultAccount(a.email);
            onChanged();
          }}
        >
          {t("Make default")}
        </button>
      )}
      <button
        className={XBTN}
        title={t("Disconnect this account")}
        data-testid={`gcal-disconnect-${a.email}`}
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          await disconnectGcalAccount(a.email);
          setBusy(false);
          onChanged();
        }}
      >
        ×
      </button>
    </div>
  );
}
