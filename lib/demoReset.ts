export function isDemoModeServer(): boolean {
  return (
    process.env.DEMO_MODE === "true" ||
    process.env.NEXT_PUBLIC_DEMO_MODE === "true"
  );
}
