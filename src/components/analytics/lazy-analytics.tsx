"use client";

import { useEffect, useState } from "react";

export function LazyAnalytics() {
  const [loadAnalytics, setLoadAnalytics] = useState(false);

  useEffect(() => {
    // Load analytics after hydration and initial render
    const timer = setTimeout(() => {
      setLoadAnalytics(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!loadAnalytics) return null;

  return <AnalyticsLoader />;
}

function AnalyticsLoader() {
  const { Analytics } = require("@vercel/analytics/next");
  const { SpeedInsights } = require("@vercel/speed-insights/next");

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
