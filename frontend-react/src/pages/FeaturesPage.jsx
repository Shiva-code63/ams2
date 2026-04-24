import { Link } from 'react-router-dom';

const features = [
  'Role-based authentication with JWT',
  'Face registration and verification flow',
  'QR attendance sessions with expiry control',
  'CRUD management for students, teachers, and subjects',
  'Charts, reports, and export-ready dashboards',
  'Responsive glassmorphism UI for desktop and mobile',
];

export default function FeaturesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="card">
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/70">Features</p>
        <h1 className="mt-4 text-4xl font-semibold text-white">Built like a polished university website.</h1>
        <p className="mt-4 max-w-3xl text-slate-300">
          Everything is organized around a clear public experience, with the operational dashboards tucked behind login where they belong.
        </p>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {features.map((item) => (
          <div key={item} className="card">
            <p className="text-white">{item}</p>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <Link to="/login" className="btn btn-primary">
          Open Portal
        </Link>
      </div>
    </div>
  );
}
