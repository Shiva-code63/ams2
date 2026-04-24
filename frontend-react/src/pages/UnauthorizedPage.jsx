import { Link } from 'react-router-dom';

export default function UnauthorizedPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-xl items-center px-4 text-center">
      <div className="card w-full">
        <h1 className="text-3xl font-semibold text-white">Unauthorized</h1>
        <p className="mt-3 text-slate-300">You do not have permission to access this area.</p>
        <Link to="/login" className="btn btn-primary mt-6">
          Return to Login
        </Link>
      </div>
    </div>
  );
}
