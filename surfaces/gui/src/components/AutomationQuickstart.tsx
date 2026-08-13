import { useEffect, useRef, useState } from "react";
import {
  getConnectors,
  getRecentChannels,
  type Connector,
  type RecentChannel,
} from "../api";
import { ConnectorBadge } from "../connectors/ConnectorIcon";
import { useI18n } from "../i18n/react";
import { ChannelPicker } from "./SubscriptionsChip";
import { SelectMenu } from "./SelectMenu";

// Automations quickstart: templates + schedule. Cloud one-click connect removed —
// connectors that aren't connected get manual guidance (Connectors page / token).
// Templates with no connector deps still create immediately.

const DAYS: Record<string, { label: string; dow: string }> = {
  mon: { label: "Mondays", dow: "1" },
  tue: { label: "Tuesdays", dow: "2" },
  wed: { label: "Wednesdays", dow: "3" },
  thu: { label: "Thursdays", dow: "4" },
  fri: { label: "Fridays", dow: "5" },
  sat: { label: "Saturdays", dow: "6" },
  sun: { label: "Sundays", dow: "0" },
  weekdays: { label: "Weekdays", dow: "1-5" },
  daily: { label: "Every day", dow: "*" },
};

// Exported for any leftover consumers that imported the shared spinner.
export const Spinner = () => (
  <span className="inline-block w-3 h-3 rounded-full border-[1.5px] border-line2 border-t-accent animate-spin" />
);

const cronFor = (dayKey: string, hhmm: string) => {
  const [h, m] = hhmm.split(":");
  return `${Number(m) || 0} ${Number(h) || 9} * * ${DAYS[dayKey]?.dow ?? "*"}`;
};

interface QuickTemplate {
  key: string;
  title: string;
  blurb: string;
  cadence: string;
  conns: { name: string; why: string }[];
  needsRepo?: boolean;
  needsChannel?: boolean;
  consent?: boolean;
  deliver?: boolean;
  day: string;
  time: string;
  instructions: (ctx: { repo: string; channel: string; deliver: "app" | "slack" }) => string;
}

// Prefer templates that work without managed OAuth; keep connector-dependent ones
// but only with manual-connect guidance (no connectManaged).
const TEMPLATES: QuickTemplate[] = [
  {
    key: "news",
    title: "Morning news briefing",
    blurb: "A 5-bullet tech & world news digest, saved as markdown.",
    cadence: "Daily",
    conns: [],
    day: "daily",
    time: "08:00",
    instructions: () =>
      "Search the web for the most important technology and world news from the last 24 hours " +
      "and write a concise 5-bullet briefing, saved as a markdown file.",
  },
  {
    key: "cleanup",
    title: "Folder cleanup",
    blurb: "Sort recent Downloads into tidy folders by type.",
    cadence: "Weekly",
    conns: [],
    day: "fri",
    time: "17:30",
    instructions: () => "Sort my recent Downloads into tidy folders by file type.",
  },
  {
    key: "github",
    title: "GitHub digest",
    blurb: "Merged PRs and commits, posted to your team's Slack.",
    cadence: "Weekly",
    conns: [
      { name: "slack", why: "Where the digest posts" },
      { name: "github", why: "What the digest summarizes" },
    ],
    needsRepo: true,
    needsChannel: true,
    consent: true,
    day: "mon",
    time: "09:00",
    instructions: ({ repo, channel }) =>
      `Summarize activity since the last digest in the GitHub repository ${repo || "(the connected repository)"}: ` +
      `merged pull requests, notable commits, and anything needing attention. ` +
      `Post the digest to the Slack channel ${channel} using send_message.`,
  },
  {
    key: "pipeline",
    title: "Pipeline digest",
    blurb: "Deals that moved — and deals going quiet — posted to Slack.",
    cadence: "Weekly",
    conns: [
      { name: "slack", why: "Where the digest posts" },
      { name: "hubspot", why: "Pipeline and deal activity" },
    ],
    needsChannel: true,
    consent: true,
    day: "mon",
    time: "09:00",
    instructions: ({ channel }) =>
      `Review HubSpot activity since the last digest: deals that changed stage, deals going ` +
      `quiet, and deals past their close date. Post a short pipeline digest to the Slack ` +
      `channel ${channel} using send_message.`,
  },
  {
    key: "brief",
    title: "Morning brief",
    blurb: "Calendar and unread email, summarized before your day starts.",
    cadence: "Daily",
    conns: [
      { name: "google_calendar", why: "Today's meetings and gaps" },
      { name: "gmail", why: "What arrived overnight" },
    ],
    deliver: true,
    day: "daily",
    time: "08:00",
    instructions: ({ deliver }) =>
      `Prepare a short morning brief: today's calendar events and gaps, plus email that ` +
      `arrived since yesterday evening. ` +
      (deliver === "app" ? "Save it as the session deliverable." : "Send it to me as a Slack DM."),
  },
  {
    key: "inboxdigest",
    title: "Inbox digest",
    blurb: "One short digest of your unread email.",
    cadence: "Weekdays",
    conns: [{ name: "gmail", why: "Your unread email" }],
    day: "weekdays",
    time: "09:00",
    instructions: () => "Summarize my unread email into one short digest note.",
  },
];

export function AutomationQuickstart({
  busy,
  onCreate,
}: {
  busy: boolean;
  onCreate: (payload: {
    title: string;
    instructions: string;
    cron?: string;
    permissions?: { tool: string; target: string; access: "read" | "write" }[];
  }) => void;
}) {
  const { t } = useI18n();
  const [pickedKey, setPickedKey] = useState<string | null>(null);
  const picked = TEMPLATES.find((tpl) => tpl.key === pickedKey) || null;

  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [recent, setRecent] = useState<RecentChannel[]>([]);
  const [repo, setRepo] = useState("");
  const [channel, setChannel] = useState("");
  const [day, setDay] = useState("mon");
  const [time, setTime] = useState("09:00");
  const [deliver, setDeliver] = useState<"app" | "slack">("app");
  const [consent, setConsent] = useState(true);

  const refresh = () => {
    getConnectors().then(setConnectors).catch(() => {});
  };
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    refresh();
  }, []);
  useEffect(() => {
    if (!picked) return;
    refresh();
    getRecentChannels().then(setRecent).catch(() => {});
    pollRef.current = setInterval(refresh, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickedKey]);

  const connState = (name: string) => connectors.find((c) => c.name === name);
  const allConnected = !picked || picked.conns.every((c) => connState(c.name)?.connected);
  const needsManual = !!picked && picked.conns.length > 0 && !allConnected;

  const [picked_names, setPickedNames] = useState<Record<string, { name: string; workspace?: string }>>({});
  const pickedInfo = picked_names[channel];
  const channelName = pickedInfo?.name || recent.find((c) => c.channel === channel)?.name;
  const channelLabel = channelName ? `#${channelName}` : channel;
  const channelWorkspace = pickedInfo?.workspace;

  const cfgRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (pickedKey) cfgRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [pickedKey]);

  const pick = (tpl: QuickTemplate) => {
    setPickedKey(tpl.key);
    setDay(tpl.day);
    setTime(tpl.time);
    setConsent(true);
  };

  const create = () => {
    if (!picked) return;
    onCreate({
      title: picked.title,
      instructions: picked.instructions({ repo, channel, deliver }),
      cron: cronFor(day, time),
      permissions:
        picked.consent && consent && channel
          ? [{ tool: "send_message", target: channel, access: "write" }]
          : [],
    });
  };

  const gateHint = !allConnected
    ? t("Connect {names} to continue", {
        names:
          picked?.conns
            .filter((c) => !connState(c.name)?.connected)
            .map((c) => connState(c.name)?.title || c.name)
            .join(t(" and ")) || "",
      })
    : picked?.needsChannel && !channel
      ? t("Pick a channel to post to first")
      : "";

  const label = "block text-[12px] text-muted mt-3 mb-1";
  const input =
    "w-full px-3 py-2 rounded-lg border border-line bg-panel text-[13.5px] outline-none focus:border-accent";

  return (
    <div className="mb-4">
      <div className="text-[11px] uppercase tracking-[0.05em] text-faint mb-2.5">
        {t("Start from a template")}
      </div>
      <div className="grid grid-cols-3 auto-rows-fr gap-3">
        {TEMPLATES.map((tpl) => (
          <button
            key={tpl.key}
            data-testid={`qs-template-${tpl.key}`}
            className={
              "h-full text-left rounded-xl2 border bg-panel p-4 flex flex-col gap-1.5 " +
              (pickedKey === tpl.key
                ? "border-accent ring-2 ring-accentSoft"
                : "border-line hover:border-lineStrong")
            }
            onClick={() => pick(tpl)}
          >
            <span className="text-[13.5px] font-semibold">{t(tpl.title)}</span>
            <span className="text-[12px] text-muted leading-relaxed flex-1">{t(tpl.blurb)}</span>
            <span className="flex items-center gap-1.5 mt-1">
              {tpl.conns.map((c) => {
                const cs = connState(c.name);
                const on = !!cs?.connected;
                return (
                  <span
                    key={c.name}
                    title={t("{name} — {status}", { name: cs?.title || c.name, status: on ? t("connected") : t("not connected yet") })}
                    style={on ? undefined : { filter: "grayscale(1)", opacity: 0.55 }}
                  >
                    {cs ? (
                      <ConnectorBadge connector={cs} size={16} title={cs.title} />
                    ) : (
                      <span className="inline-block w-4 h-4 rounded-full border border-line2" />
                    )}
                  </span>
                );
              })}
              <span className="text-[11px] text-faint ml-0.5">
                {tpl.conns.length === 0
                  ? t("No connections needed · {cadence}", { cadence: t(tpl.cadence) })
                  : t(tpl.cadence)}
              </span>
            </span>
          </button>
        ))}
      </div>

      {picked && (
        <div
          ref={cfgRef}
          className="mt-3 rounded-xl2 border border-line bg-panel p-4"
          data-testid="qs-configure"
        >
          <div className="flex items-baseline gap-2 pb-2.5 mb-1 border-b border-line">
            <span className="text-[11px] uppercase tracking-[0.05em] text-accent font-semibold">
              {t("Set up")}
            </span>
            <span className="text-[14px] font-semibold">{t(picked.title)}</span>
            <span className="ml-auto text-[12px] text-faint max-sm:hidden">
              {picked.conns.length ? t("Connections, delivery & schedule") : t("Delivery & schedule")} ·{" "}
              {t(picked.cadence)}
            </span>
          </div>

          {picked.conns.map(({ name, why }) => {
            const c = connState(name);
            return (
              <div key={name} className="border-b border-line last:border-b-0">
                <div className="flex items-center gap-3 py-2.5">
                  {c && <ConnectorBadge connector={c} size={26} title={c.title} />}
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] font-medium">{c?.title || name}</span>
                    <span className="block text-[11.5px] text-faint">{t(why)}</span>
                  </span>
                  {c?.connected ? (
                    <span className="text-[12.5px] text-ok">{t("✓ Connected")}</span>
                  ) : (
                    <span className="text-[12px] text-muted shrink-0">{t("Not connected")}</span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Manual connect only — no cloudLogin / connectManaged */}
          {needsManual && (
            <div
              className="bg-paper rounded-xl px-4 py-3 mt-3 text-[12.5px] text-muted"
              data-testid="qs-manual-connect"
            >
              <span className="block text-[13px] text-ink font-medium mb-0.5">
                {t("Connect these tools manually")}
              </span>
              {t("Open Connectors and add a token (or OAuth where available). One-click cloud connect is not available.")}
            </div>
          )}

          {allConnected && (
            <div className={picked.conns.length ? "bg-paper rounded-xl px-4 py-3.5 mt-3" : ""} data-testid="ob-recipe">
              {picked.needsRepo && (
                <>
                  <label className={label}>{t("Repository")}</label>
                  <input
                    className={input}
                    placeholder="owner/repo"
                    value={repo}
                    onChange={(e) => setRepo(e.target.value)}
                    data-testid="ob-repo"
                  />
                </>
              )}
              {picked.needsChannel && (
                <>
                  <label className={label}>{t("Post to channel")}</label>
                  <div data-testid="ob-channel">
                    <ChannelPicker
                      value={channel}
                      onChange={setChannel}
                      recent={recent}
                      onPickName={(address, name, workspace) =>
                        setPickedNames((m) => ({ ...m, [address]: { name, workspace } }))
                      }
                    />
                  </div>
                  <p className="text-[11px] text-warnInk mt-1">
                    {t("The bot must be a member of the channel — invite @TonWorker in Slack if it isn't.")}
                  </p>
                </>
              )}
              <label className={label}>{t("When")}</label>
              <div className="flex gap-2">
                <div className="flex-1 min-w-0">
                  <SelectMenu
                    ariaLabel={t("Day")}
                    value={day}
                    options={Object.entries(DAYS).map(([k, v]) => ({ value: k, label: t(v.label) }))}
                    onChange={setDay}
                  />
                </div>
                <input
                  className="w-28 px-3 py-2 rounded-lg border border-line bg-panel text-[13.5px] outline-none focus:border-accent"
                  type="time"
                  aria-label={t("Time")}
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
              {picked.deliver && (
                <>
                  <label className={label}>{t("Deliver to")}</label>
                  <SelectMenu
                    ariaLabel={t("Deliver to")}
                    value={deliver}
                    options={[
                      { value: "app", label: t("In the app") },
                      { value: "slack", label: t("Slack DM (connect Slack later)") },
                    ]}
                    onChange={(v) => setDeliver(v as "app" | "slack")}
                  />
                </>
              )}
              {picked.consent ? (
                <label className="flex items-start gap-2.5 mt-3.5 text-[12.5px] text-muted select-none">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    data-testid="ob-consent"
                  />
                  <span>
                    {t("Allow this automation to post its digest to")}{" "}
                    <b className="text-ink" title={channel || undefined}>
                      {channelLabel || t("the channel")}
                      {channelWorkspace ? ` (${channelWorkspace})` : ""}
                    </b>{" "}
                    {t("without asking each time. Anything else still asks first.")}
                  </span>
                </label>
              ) : picked.conns.length > 0 ? (
                <p className="text-[12.5px] text-muted mt-3">
                  {t("This automation only")} <b className="text-ink">{t("reads")}</b> {t("on schedule — reading never needs approval.")}
                </p>
              ) : null}
            </div>
          )}

          <div className="flex items-center gap-3 mt-4">
            <button
              className="text-[12.5px] text-faint hover:text-muted"
              onClick={() => setPickedKey(null)}
            >
              {t("Cancel")}
            </button>
            {gateHint && (
              <span className="ml-auto text-[11.5px] text-faint" data-testid="ob-create-hint">
                {gateHint}
              </span>
            )}
            <button
              className={
                (gateHint ? "" : "ml-auto ") +
                "px-5 py-2 rounded-full bg-ink text-panel text-[13px] disabled:opacity-40"
              }
              disabled={busy || !allConnected || (picked.needsChannel && !channel)}
              onClick={create}
              data-testid="ob-create"
            >
              {busy ? t("Creating…") : t("Create automation")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
