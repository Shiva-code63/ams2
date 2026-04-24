import { Link } from 'react-router-dom';

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-xl items-center px-4">
      <div className="card w-full">
        <h1 className="text-2xl font-semibold text-white">Forgot Password</h1>
        <p className="mt-2 text-sm text-slate-300">Enter your email to receive a reset link.</p>
        <input className="field mt-6" placeholder="Email address" />
        <button className="btn btn-primary mt-4 w-full">Send reset link</button>
        <Link to="/login" className="mt-4 block text-center text-sm text-cyan-200">
          Back to login
        </Link>
      </div>
    </div>
  );
}
