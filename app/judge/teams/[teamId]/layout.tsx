import React from "react";

export function generateStaticParams() {
  return [{ teamId: "T001" }];
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
