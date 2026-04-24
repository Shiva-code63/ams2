export default function SectionTitle({ eyebrow, title, description }) {
  return (
    <div className="mb-5">
      <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/70">{eyebrow}</p>
      <h3 className="mt-2 text-2xl font-semibold text-white">{title}</h3>
      <p className="mt-2 max-w-3xl text-sm text-slate-300">{description}</p>
    </div>
  );
}
