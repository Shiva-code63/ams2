import { useEffect, useMemo, useState } from 'react';
import SectionTitle from '../../components/SectionTitle';
import { createStudent, deleteStudent, listAdminStudents } from '../../services/api';
import toast from 'react-hot-toast';

export default function StudentsPage() {
  const [page, setPage] = useState({ content: [] });
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ name: '', enrollmentNumber: '' });

  const normalizedSearch = useMemo(() => search.trim(), [search]);

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await listAdminStudents({ page: 0, size: 50, search: normalizedSearch || undefined });
      setPage(data);
    } catch {
      toast.error('Failed to load students');
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
    if ((form.enrollmentNumber || '').trim().length !== 11) return toast.error('Enrollment number must be 11 characters');

    setIsAdding(true);
    try {
      await createStudent({ name: form.name.trim(), enrollmentNumber: form.enrollmentNumber.trim() });
      toast.success('Student added');
      setForm({ name: '', enrollmentNumber: '' });
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to add student');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionTitle eyebrow="Students" title="Student Management" description="Search, add, edit, paginate, and inspect student records from one place." />

      <div className="card">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="w-full md:max-w-md">
            <label className="label">Search</label>
            <input className="field" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name / enrollment / email" />
          </div>
          <form onSubmit={onAdd} className="grid w-full gap-3 md:w-auto md:grid-cols-3">
            <div>
              <label className="label">Name</label>
              <input className="field" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} placeholder="Student name" />
            </div>
            <div>
              <label className="label">Enrollment (11 chars)</label>
              <input
                className="field"
                value={form.enrollmentNumber}
                onChange={(e) => setForm((s) => ({ ...s, enrollmentNumber: e.target.value }))}
                placeholder="S25CSEU1020"
              />
            </div>
            <button disabled={isAdding} className="btn btn-primary mt-6">
              {isAdding ? 'Adding...' : 'Add Student'}
            </button>
          </form>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-slate-400">
            <tr>
              <th className="py-3">Name</th>
              <th>Enrollment</th>
              <th>Email</th>
              <th>Attendance</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr className="border-t border-white/5 text-slate-200">
                <td className="py-4" colSpan={5}>
                  Loading...
                </td>
              </tr>
            ) : (
              page.content.map((student) => (
              <tr key={student.id} className="border-t border-white/5 text-slate-200">
                <td className="py-4">{student.name}</td>
                <td>{student.enrollmentNumber}</td>
                <td>{student.collegeEmail}</td>
                <td>{Math.round((student.attendancePercentage || 0) * 10) / 10}%</td>
                <td className="text-right">
                  <button
                    onClick={async () => {
                      if (!window.confirm(`Delete student "${student.name}"?`)) return;
                      try {
                        await deleteStudent(student.id);
                        toast.success('Student deleted');
                        await load();
                      } catch (error) {
                        toast.error(error?.response?.data?.message || 'Failed to delete student');
                      }
                    }}
                    className="btn btn-danger px-2 py-1 text-sm"
                  >
                    Delete
                  </button>
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
