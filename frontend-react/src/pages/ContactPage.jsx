import { Link } from 'react-router-dom';

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="card">
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/70">Contact</p>
        <h1 className="mt-4 text-4xl font-semibold text-white">Talk to the AMS2 team</h1>
        <p className="mt-4 text-slate-300">
          Use this space for campus IT contacts, support details, or a simple inquiry form.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <input className="field" placeholder="Full name" />
          <input className="field" placeholder="Email address" />
          <textarea className="field md:col-span-2" rows="5" placeholder="Message" />
        </div>
        <div className="mt-6 flex gap-3">
          <button className="btn btn-primary">Send Message</button>
          <Link to="/login" className="btn btn-secondary">
            Open Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
