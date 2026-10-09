import React from "react";

export function generateStaticParams() {
  return [{ judgeId: "J001" }];
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
