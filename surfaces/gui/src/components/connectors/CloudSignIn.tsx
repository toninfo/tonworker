// Cloud managed OAuth / relay is disabled — these used to render one-click
// sign-in prompts across connector panes. Keep the exports so hosts compile,
// but render nothing.
export function CloudSignInInline(_props?: { blurb?: string }) {
  return null;
}

export function CloudStatusPending() {
  return null;
}
