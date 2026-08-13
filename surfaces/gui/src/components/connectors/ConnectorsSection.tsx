import { useEffect, useState } from "react";
import {
  disconnectConnector,
  getConnectors,
  getSlackStatus,
  type Connector,
  type SlackStatus,
} from "../../api";
import { ConnectorBadge } from "../../connectors/ConnectorIcon";
import { useI18n } from "../../i18n/react";
import { AllowlistBlock, ConnectorTools, ListeningSessionsBlock, UnauthorizedBlock } from "../ManageTabs";
import { AccountsDetail } from "./AccountsDetail";
import { AvailableDetail } from "./AvailableDetail";
import { CalendarDetail } from "./CalendarDetail";
import { ConnectorsList } from "./ConnectorsList";
import { GithubDetail } from "./GithubDetail";
import { GmailDetail } from "./GmailDetail";
import { HubSpotDetail } from "./HubSpotDetail";
import { SlackDetail } from "./SlackDetail";
import { GRP } from "./ui";

// Connectors surface = LIST ⇄ per-connector DETAIL SUBPAGE (UX-DECISIONS §21). The
// Integrations sub-nav never grows per-connector items; detail pages live behind a
// `‹ Connectors` breadcrumb. Connectors without a bespoke page get GenericDetail so
// every connected row navigates from day one.

export interface DetailProps {
  c: Connector;
  slack: SlackStatus | null; // live Slack token health for legacy relay workspaces
  onChanged: () => void;
}

// Bespoke pages register here; everything else gets GenericDetail below.
const DETAIL_PAGES: Record<string, (p: DetailProps) => JSX.Element> = {
  slack: (p) => <SlackDetail {...p} />,
  gmail: (p) => <GmailDetail {...p} />,
  google_calendar: (p) => <CalendarDetail {...p} />,
  hubspot: (p) => <HubSpotDetail {...p} />,
  github: (p) => <GithubDetail {...p} />,
  // Generic multi-account connectors (accounts.py layer) share one page.
  notion: (p) => <AccountsDetail {...p} />,
  attio: (p) => <AccountsDetail {...p} />,
  posthog: (p) => <AccountsDetail {...p} />,
  mixpanel: (p) => <AccountsDetail {...p} />,
  amplitude: (p) => <AccountsDetail {...p} />,
  apollo: (p) => <AccountsDetail {...p} />,
  hunter: (p) => <AccountsDetail {...p} />,
};

export function ConnectorsSection() {
  const { t } = useI18n();
  const [detail, setDetail] = useState<string | null>(null);
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [slack, setSlack] = useState<SlackStatus | null>(null);
  // 区分「真的没有连接器」和「后端挂了 / 鉴权失败」——后者以前被 catch 成空数组，看起来像目录被清空
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = () => {
    getConnectors()
      .then((list) => {
        setConnectors(list);
        setLoadError(null);
      })
      .catch((err) => {
        setConnectors([]);
        setLoadError(err instanceof Error ? err.message : String(err));
      });
    getSlackStatus().then(setSlack).catch(() => setSlack(null));
  };
  useEffect(() => {
    refresh();
    // Poll: recent senders/parked arrive over time; manual connects finish via the form.
    const timer = setInterval(refresh, 5000);
    return () => clearInterval(timer);
  }, []);

  if (detail) {
    const c = connectors.find((x) => x.name === detail);
    const Page = DETAIL_PAGES[detail];
    return (
      <div>
        <button
          className="text-[13px] text-accent mb-3"
          data-testid="connectors-breadcrumb"
          onClick={() => setDetail(null)}
        >
          ‹ {t("Connectors")}
        </button>
        {!c ? (
          <div className="text-[13px] text-muted">{t("Loading…")}</div>
        ) : !c.connected ? (
          /* Pre-connect page (§38). When a connect completes, the poll flips
             c.connected and this same route re-renders as the connected page. */
          <AvailableDetail c={c} onChanged={refresh} />
        ) : Page ? (
          <Page c={c} slack={slack} onChanged={refresh} />
        ) : (
          <GenericDetail
            c={c}
            slack={slack}
            onChanged={refresh}
            onGone={() => setDetail(null)}
          />
        )}
      </div>
    );
  }

  return (
    <>
      {loadError && (
        <div
          className="mb-3 rounded-lg border border-line bg-panel/60 px-3.5 py-2.5 text-[12.5px] text-muted"
          data-testid="connectors-load-error"
        >
          {t("Couldn't load connectors — is the local server running?")}
          <span className="block text-[11.5px] text-faint mt-1 truncate">{loadError}</span>
        </div>
      )}
      <ConnectorsList
        connectors={connectors}
        onOpen={setDetail}
        onChanged={refresh}
      />
    </>
  );
}

// Fallback detail page: status header + the connector's existing config blocks
// (tools; allow-list/parked/listening for two-way) + Disconnect. Bespoke pages
// (Slack/Gmail/HubSpot) replace this one connector at a time.
function GenericDetail({
  c,
  onChanged,
  onGone,
}: DetailProps & { onGone: () => void }) {
  const { t } = useI18n();
  return (
    <div>
      <div className="flex items-center gap-3.5 mb-5">
        <ConnectorBadge connector={c} size={44} title={c.title} />
        <div className="min-w-0 flex-1">
          <h2 className="text-[20px] font-semibold tracking-tight leading-tight">{c.title}</h2>
          <div className="text-[12.5px] text-muted flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-ok" />
            {c.account || (c.auth === "none" ? t("Built in") : t("Connected"))}
          </div>
        </div>
        {c.auth !== "none" && (
          <button
            className="text-[12.5px] text-danger/80 hover:text-danger shrink-0"
            onClick={async () => {
              await disconnectConnector(c.name);
              onChanged();
              onGone();
            }}
          >
            {t("Disconnect")}
          </button>
        )}
      </div>

      <div className={GRP}>
        <ConnectorTools c={c} onChanged={onChanged} />
      </div>

      {c.two_way && (
        <div className={GRP + " mt-4"}>
          <AllowlistBlock c={c} onChanged={onChanged} />
          <UnauthorizedBlock c={c} onChanged={onChanged} />
          {c.channels && <ListeningSessionsBlock c={c} />}
        </div>
      )}
    </div>
  );
}
