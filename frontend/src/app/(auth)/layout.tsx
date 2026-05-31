export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth pages have no sidebar/topbar, just a clean centered layout
  return <>{children}</>;
}
