export default function StatCard({ label, value, hint }) {
  return (
    <div className="card">
      <p className="text-sm text-slate-400">{label}</p>
      <div className="mt-3 text-3xl font-semibold text-white">{value}</div>
      <p className="mt-2 text-sm text-slate-300">{hint}</p>
    </div>
  );
}
