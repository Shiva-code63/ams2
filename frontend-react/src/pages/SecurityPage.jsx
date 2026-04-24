import { Link } from 'react-router-dom';

const securityItems = [
  'JWT-based session protection',
  'BCrypt password hashing',
  'Role-based route and API access',
  'Duplicate attendance prevention',
  'Duplicate face registration checks',
  'QR session expiry and token validation',
];

export default function SecurityPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="card">
        <p className="text-xs uppercase tracking-[0.35em] text-violet-200/70">Security</p>
        <h1 className="mt-4 text-4xl font-semibold text-white">Security designed for a real campus portal.</h1>
        <p className="mt-4 max-w-3xl text-slate-300">
          The website keeps authentication separate from the public site and protects each role area with explicit access rules.
        </p>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {securityItems.map((item) => (
          <div key={item} className="card">
            <p className="text-white">{item}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 flex gap-3">
        <Link to="/login" className="btn btn-primary">
          Sign In
        </Link>
        <Link to="/" className="btn btn-secondary">
          Back Home
        </Link>
      </div>
    </div>
  );
}
