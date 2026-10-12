import React from "react";

// GitHub Pages is a static export. Arbitrary IDs created after deployment cannot
// be generated as path segments. New events use /events/detail?eventId=<id>,
// /events/portal?eventId=<id>, and /events/login?eventId=<id> instead.
export function generateStaticParams() {
  return [{ eventId: "evt-01" }];
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
