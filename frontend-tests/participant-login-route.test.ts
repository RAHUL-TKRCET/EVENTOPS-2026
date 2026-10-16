import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("participant login route shell allowlist", () => {
  it("does not intercept the event-scoped participant login page", () => {
    const appShell = readFileSync(resolve(process.cwd(), "components/layout/AppShell.tsx"), "utf8");
    expect(appShell).toContain('"/participant/login"');
    expect(appShell).toContain('const isPublicPage =');
  });

  it("keeps participant authentication event-scoped", () => {
    const loginPage = readFileSync(resolve(process.cwd(), "app/participant/login/page.tsx"), "utf8");
    expect(loginPage).toContain('authApi.eventLogin(eventId, email, password, "PARTICIPANT")');
    expect(loginPage).toContain('router.push(`/participant?eventId=${encodeURIComponent(eventId)}`)');
  });
});
