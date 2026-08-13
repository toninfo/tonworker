import { useState } from "react";
import { setOnboarded } from "../api";
import { useI18n } from "../i18n/react";
import { ProviderCards, ProviderForm, useProviderSetup } from "../providers/ProviderSetup";

// First-run onboarding: model → done. Cloud sign-in / managed one-click tools
// removed (backend cloud disabled). Connectors stay available via Connectors page
// with manual token connect. Replayable from Settings ▸ General ▸ "Run setup again".

export function Onboarding({ onDone }: { onDone: (next?: "work" | "gallery" | "automations") => void }) {
  const { t } = useI18n();
  // 0 = model, 1 = you're set up
  const [step, setStep] = useState(0);

  const ps = useProviderSetup();
  const [skipConfirm, setSkipConfirm] = useState(false);

  const anyReady =
    ps.providers.some((p) => p.configured && p.needs_key) || ps.keylessOk.size > 0;
  // In the form with typed-but-untested input, Next verifies+saves first.
  const nextFromForm = !!ps.sel && ps.dirty && ps.secretFilled;
  const canNext = anyReady || nextFromForm;

  const advance = async () => {
    if (nextFromForm && !ps.credentialed) {
      ps.cancelBackTimer();
      if (!(await ps.runTestAndSave())) return;
    }
    setStep(1);
  };

  const finish = async (next?: "work" | "gallery" | "automations") => {
    await setOnboarded(true).catch(() => {});
    onDone(next);
  };

  const dots = (
    <div className="flex justify-center gap-2 mb-6">
      {[0, 1].map((i) => (
        <span key={i} className={"w-1.5 h-1.5 rounded-full " + (i <= step ? "bg-accent" : "bg-line")} />
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-ink/30 grid place-items-center" data-testid="onboarding">
      {/* FIXED height across steps — gallery⇄form swap happens inside this box. */}
      <div className="w-[600px] max-w-[92vw] h-[560px] max-h-[88vh] rounded-2xl border border-line bg-panel shadow-2xl p-8 flex flex-col">
        {dots}

        {step === 0 && (
          <section data-testid="ob-step-model" className="flex-1 min-h-0 flex flex-col">
            <h1 className="text-[19px] font-semibold">
              {t("Welcome to TonWorker")}
              
            </h1>
            <p className="text-[13px] text-muted mt-0.5 mb-4">
              {t("Pick a model provider to get started — TonWorker runs on your own key, and your key and your data stay on this computer.")}
            </p>

            {!ps.sel ? (
              <div className="flex-1 min-h-0 overflow-y-auto pr-1" data-testid="ob-provider-gallery">
                <ProviderCards ps={ps} tp="ob" />
              </div>
            ) : (
              <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                <ProviderForm ps={ps} tp="ob" />
              </div>
            )}

            <div className="flex items-center gap-3 pt-5">
              {!skipConfirm ? (
                <button className="text-[12.5px] text-faint hover:text-muted" onClick={() => setSkipConfirm(true)}>
                  {t("Skip setup")}
                </button>
              ) : (
                <span className="text-[12.5px] text-muted">
                  {t("Nothing works without a model —")}{" "}
                  <button className="text-accent" onClick={() => finish()}>
                    {t("skip anyway")}
                  </button>
                </span>
              )}
              <button
                className="ml-auto px-6 py-2 rounded-full bg-ink text-panel text-[13px] disabled:opacity-40"
                disabled={!canNext || ps.verify.state === "testing"}
                onClick={advance}
                data-testid="ob-continue"
              >
                {ps.verify.state === "testing" ? t("Checking…") : t("Next")}
              </button>
            </div>
            <p className="text-[11px] text-faint mt-3">
              {t("Models can be enabled or hidden anytime in Settings ▸ Models.")}
            </p>
          </section>
        )}

        {step === 1 && (
          <section data-testid="ob-step-done" className="flex-1 min-h-0 flex flex-col overflow-y-auto">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-okSoft text-ok grid place-items-center mx-auto mb-3 text-[22px]">
                ✓
              </div>
              <h1 className="text-[19px] font-semibold mb-1">{t("You're set up")}</h1>
              <p className="text-[13px] text-muted mb-5">{t("Two good ways to start:")}</p>
            </div>

            <button
              className="w-full flex items-start gap-3 rounded-xl2 border border-line hover:border-accent bg-panel px-4 py-3.5"
              onClick={() => finish("automations")}
              data-testid="ob-cta-automation"
            >
              <span className="w-9 h-9 rounded-lg bg-accentSoft text-accent grid place-items-center text-[15px] shrink-0">
                ◷
              </span>
              <span className="flex-1 min-w-0 text-left">
                <b className="block text-[13.5px]">{t("Create your first automation")}</b>
                <span className="text-[12px] text-muted">
                  {t("A weekly digest, a morning brief — pick a template, running in two minutes.")}
                </span>
              </span>
              <span className="text-faint self-center">›</span>
            </button>
            <button
              className="w-full flex items-start gap-3 rounded-xl2 border border-line hover:border-accent bg-panel px-4 py-3.5 mt-2.5"
              onClick={() => finish("work")}
              data-testid="ob-start"
            >
              <span className="w-9 h-9 rounded-lg bg-accentSoft text-accent grid place-items-center text-[15px] shrink-0">
                ✦
              </span>
              <span className="flex-1 min-w-0 text-left">
                <b className="block text-[13.5px]">{t("Start working with Coworker")}</b>
                <span className="text-[12px] text-muted">
                  {t("Open a session and just ask — analyze files, draft, research, build.")}
                </span>
              </span>
              <span className="text-faint self-center">›</span>
            </button>

            <p className="text-[11px] text-faint text-center mt-auto pt-5">
              {t("Replay this setup anytime: Settings ▸ Appearance ▸ Run setup again.")}
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
