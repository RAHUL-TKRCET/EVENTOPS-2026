import React from "react";

export function generateStaticParams() {
  return [{ roundId: "rnd-1" }];
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
