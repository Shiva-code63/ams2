import { useEffect, useMemo, useState } from 'react';
import SectionTitle from '../../components/SectionTitle';
import { createTeacher, deleteTeacher, listAdminTeachers } from '../../services/api';
import toast from 'react-hot-toast';

export default function TeachersPage() {
  const [page, setPage] = useState({ content: [] });
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ name: '', employeeId: '', email: '' });

  const normalizedSearch = useMemo(() => search.trim(), [search]);

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await listAdminTeachers({ page: 0, size: 50, search: normalizedSearch || undefined });
      setPage(data);
    } catch {
      toast.error('Failed to load teachers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedSearch]);

  const onAdd = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required');
    if (!form.employeeId.trim()) return toast.error('Employee ID is required');
    if (!form.email.trim()) return toast.error('Email is required');

    setIsAdding(true);
    try {
      await createTeacher({ name: form.name.trim(), employeeId: form.employeeId.trim(), email: form.email.trim() });
      toast.success('Teacher added');
      setForm({ name: '', employeeId: '', email: '' });
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to add teacher');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionTitle eyebrow="Teachers" title="Teacher Registry" description="Maintain faculty profiles, employee IDs, and assigned subjects." />

      <div className="card">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="w-full md:max-w-md">
            <label className="label">Search</label>
            <input className="field" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name / employee ID / email" />
          </div>
          <form onSubmit={onAdd} className="grid w-full gap-3 md:w-auto md:grid-cols-4">
            <div>
              <label className="label">Name</label>
              <input className="field" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} placeholder="Teacher name" />
            </div>
            <div>
              <label className="label">Employee ID</label>
              <input className="field" value={form.employeeId} onChange={(e) => setForm((s) => ({ ...s, employeeId: e.target.value }))} placeholder="EMP102" />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="field" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} placeholder="name@bennett.edu.in" />
            </div>
            <button disabled={isAdding} className="btn btn-primary mt-6">
              {isAdding ? 'Adding...' : 'Add Teacher'}
            </button>
          </form>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {isLoading ? (
          <div className="card text-slate-300">Loading...</div>
        ) : (
          page.content.map((teacher) => (
            <div key={teacher.id} className="card">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-lg font-semibold text-white">{teacher.name}</h4>
                  <p className="mt-1 text-sm text-slate-300">{teacher.email}</p>
                  <p className="mt-4 text-sm text-slate-400">Employee ID: {teacher.employeeId}</p>
                  {teacher.phoneNumber && <p className="text-sm text-slate-400">Phone: {teacher.phoneNumber}</p>}
                </div>
                <button
                  onClick={async () => {
                    if (!window.confirm(`Delete teacher "${teacher.name}"?`)) return;
                    try {
                      await deleteTeacher(teacher.id);
                      toast.success('Teacher deleted');
                      await load();
                    } catch (error) {
                      toast.error(error?.response?.data?.message || 'Failed to delete teacher');
                    }
                  }}
                  className="btn btn-danger text-sm py-1 px-2"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
