import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, ScanLine, QrCode, GraduationCap } from 'lucide-react';

const roleCards = [
  { title: 'Admin Portal', description: 'Manage students, teachers, subjects, and attendance reports from a secure workspace.', href: '/login', icon: ShieldCheck },
  { title: 'Student Portal', description: 'Register a face, scan QR sessions, and track attendance history in one place.', href: '/login', icon: ScanLine },
  { title: 'Teacher Portal', description: 'Generate QR sessions, manage manual attendance, and review class reports.', href: '/login', icon: QrCode },
];

const trustPoints = [
  'JWT authentication',
  'BCrypt password hashing',
  'QR session expiry',
  'Face registration flow',
  'Charts and reporting',
  'Responsive UI',
];

const workflow = [
  { step: '1', title: 'Login by role', text: 'Users sign in as admin, student, or teacher and land in the correct portal.' },
  { step: '2', title: 'Capture attendance', text: 'Teachers generate QR sessions while students verify identity with face capture first.' },
  { step: '3', title: 'Review analytics', text: 'Admins and teachers inspect records, trends, and low-attendance alerts.' },
];

export default function LandingPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:py-10">
        <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden p-8 sm:p-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs uppercase tracking-[0.35em] text-cyan-100">
            <GraduationCap className="h-4 w-4" />
            Campus attendance portal
          </div>
          <h1 className="mt-6 max-w-2xl text-4xl font-semibold leading-tight text-white sm:text-6xl">
            A modern attendance website for an entire college.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-slate-300 sm:text-lg">
            AMS2 gives you a polished public website, then routes admins, students, and teachers into secure role-based workspaces after login.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/login" className="btn btn-primary">
              Open Portal
            </Link>
            <Link to="/features" className="btn btn-secondary">
              Explore Features
            </Link>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {trustPoints.map((point) => (
              <div key={point} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                {point}
              </div>
            ))}
          </div>
        </motion.section>

        <motion.aside
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          className="card flex flex-col justify-between bg-gradient-to-br from-white/10 to-white/5 p-8"
        >
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-slate-300">Role portals</p>
            <div className="mt-6 space-y-4">
              {roleCards.map(({ title, description, href, icon: Icon }) => (
                <Link key={title} to={href} className="block rounded-3xl border border-white/10 bg-slate-950/50 p-5 transition hover:border-cyan-400/30 hover:bg-slate-950/70">
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl bg-cyan-400/10 p-3 text-cyan-200">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{title}</h3>
                      <p className="mt-2 text-sm text-slate-300">{description}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          <div className="mt-8 rounded-3xl border border-white/10 bg-slate-950/60 p-5">
            <p className="text-xs uppercase tracking-[0.35em] text-violet-200/70">Database</p>
            <p className="mt-2 text-lg text-white">MySQL `ams2`</p>
          </div>
        </motion.aside>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {workflow.map((item) => (
          <div key={item.step} className="card">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 text-sm font-semibold text-white">
              {item.step}
            </div>
            <h3 className="mt-4 text-xl font-semibold text-white">{item.title}</h3>
            <p className="mt-2 text-sm text-slate-300">{item.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <div className="card">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/70">What it includes</p>
          <h2 className="mt-4 text-3xl font-semibold text-white">A full portal experience, not just a login screen.</h2>
          <p className="mt-4 text-slate-300">
            The public site introduces the system, the feature pages explain the workflow, and the login gateway sends users into protected dashboards.
          </p>
        </div>
        <div className="card flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400">Ready to enter the system?</p>
            <p className="mt-2 text-2xl font-semibold text-white">Open the portal and choose your role.</p>
          </div>
          <Link to="/login" className="btn btn-primary shrink-0">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
