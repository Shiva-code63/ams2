import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
  role: z.enum(['ADMIN', 'STUDENT', 'TEACHER']),
  rememberMe: z.boolean().optional(),
});

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { role: 'ADMIN', rememberMe: true } });

  const onSubmit = async (values) => {
    try {
      const user = await login(values);
      navigate(`/${user.role.toLowerCase()}`);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Invalid credentials');
    }
  };

  return (
    <div className="mx-auto grid min-h-screen max-w-7xl items-center px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
      <div className="hidden pr-12 lg:block">
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/70">Secure access</p>
        <h1 className="mt-4 max-w-xl text-5xl font-semibold leading-tight text-white">
          One login, three roles, zero confusion.
        </h1>
        <p className="mt-5 max-w-xl text-slate-300">
          The interface is designed to redirect Admin, Student, and Teacher users into their dedicated workspace immediately after sign-in.
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="card mx-auto w-full max-w-lg">
        <h2 className="text-2xl font-semibold text-white">Welcome back</h2>
        <p className="mt-2 text-sm text-slate-300">Log in with your role-specific credentials.</p>

        <div className="mt-6">
          <label className="label">Email</label>
          <input className="field" {...register('email')} placeholder="name@bennett.edu.in" />
          {errors.email && <p className="mt-2 text-sm text-rose-300">{errors.email.message}</p>}
        </div>

        <div className="mt-4">
          <label className="label">Password</label>
          <div className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950/60 px-4">
            <input className="field border-0 px-0" type={showPassword ? 'text' : 'password'} {...register('password')} placeholder="Enter password" />
            <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-slate-400">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <p className="mt-2 text-sm text-rose-300">{errors.password.message}</p>}
        </div>

        <div className="mt-4">
          <label className="label">Role</label>
          <select className="field" {...register('role')}>
            <option value="ADMIN">Admin</option>
            <option value="STUDENT">Student</option>
            <option value="TEACHER">Teacher</option>
          </select>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-slate-300">
          <label className="flex items-center gap-2">
            <input type="checkbox" {...register('rememberMe')} />
            Remember me
          </label>
          <Link to="/forgot-password" className="text-cyan-200 hover:text-cyan-100">
            Forgot password?
          </Link>
        </div>

        <button disabled={isSubmitting} className="btn btn-primary mt-6 w-full">
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
