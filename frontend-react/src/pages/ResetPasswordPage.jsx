import { Link } from 'react-router-dom';

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-xl items-center px-4">
      <div className="card w-full">
        <h1 className="text-2xl font-semibold text-white">Reset Password</h1>
        <input className="field mt-6" placeholder="New password" />
        <input className="field mt-4" placeholder="Confirm password" />
        <button className="btn btn-primary mt-4 w-full">Reset password</button>
        <Link to="/login" className="mt-4 block text-center text-sm text-cyan-200">
          Return to login
        </Link>
      </div>
    </div>
  );
}
