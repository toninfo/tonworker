import { useState } from "react";
import { ConnectorBadge } from "../../connectors/ConnectorIcon";
import { useI18n } from "../../i18n/react";
import { AddConnectionModal } from "./AddConnectionModal";
import type { DetailProps } from "./ConnectorsSection";
import { ToolsDisclosure } from "./ToolsDisclosure";
import { GRP, PILL_ACCENT, ROW } from "./ui";

// GitHub detail: personal access token (manual) only. Managed App install / relay
// UI is retired (backend managed=False).

export function GithubDetail({ c, onChanged }: DetailProps) {
  const { t } = useI18n();
  const [adding, setAdding] = useState(false);

  return (
    <div data-testid="github-installations">
      <div className="flex items-center gap-3.5 mb-5">
        <ConnectorBadge connector={c} size={44} title="GitHub" />
        <div className="min-w-0 flex-1">
          <h2 className="text-[20px] font-semibold tracking-tight leading-tight">GitHub</h2>
          <div className="text-[12.5px] text-muted flex items-center gap-1.5">
            {c.connected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-ok" />
                <span data-testid="github-mode-badge">
                  {t("Connected · personal access token")}
                </span>
              </>
            ) : (
              <span>{t("Not connected")}</span>
            )}
          </div>
        </div>
        {!c.connected && (
          <button
            className={PILL_ACCENT}
            data-testid="add-installation-btn"
            onClick={() => setAdding(true)}
          >
            {t("Connect")}
          </button>
        )}
      </div>

      {!c.connected && (
        <div className={GRP}>
          <div className={ROW + " text-[12.5px] text-muted"}>
            {t(
              "Create a GitHub personal access token with access to the target repositories.",
            )}
          </div>
        </div>
      )}

      {c.connected && (
        <div className={GRP} data-testid="github-manual-card">
          <div className={ROW + " text-[12.5px] text-muted"}>
            {t("Personal access token · tools only (request/response).")}
          </div>
        </div>
      )}

      <ToolsDisclosure c={c} onChanged={onChanged} />

      {adding && (
        <AddConnectionModal
          c={c}
          title={t("Connect GitHub")}
          onClose={() => setAdding(false)}
          onChanged={onChanged}
        />
      )}
    </div>
  );
}
