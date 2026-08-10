export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Dashboard ({locale})</h1>
      <p>Welcome to your admin dashboard.</p>
    </div>
  );
}
