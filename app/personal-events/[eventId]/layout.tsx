import React from "react";

export function generateStaticParams() {
  return [{ eventId: "evt-01" }];
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
