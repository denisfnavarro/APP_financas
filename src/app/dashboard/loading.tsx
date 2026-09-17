export default function DashboardLoading() {
  return (
    <div className="flex animate-pulse flex-col gap-6">
      <div className="bg-muted h-8 w-48 rounded-md" />
      <div className="bg-muted h-24 rounded-xl" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-muted h-24 rounded-xl" />
        ))}
      </div>
      <div className="bg-muted h-80 rounded-xl" />
    </div>
  );
}
