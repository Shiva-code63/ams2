import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-xl items-center px-4 text-center">
      <div className="card w-full">
        <h1 className="text-4xl font-semibold text-white">404</h1>
        <p className="mt-3 text-slate-300">This page is not available.</p>
        <Link to="/" className="btn btn-secondary mt-6">
          Go Home
        </Link>
      </div>
    </div>
  );
}
