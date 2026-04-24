import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import SectionTitle from '../../components/SectionTitle';
import { useAuth } from '../../context/AuthContext';
import { createSubject, deleteSubject, listTeacherSubjects } from '../../services/api';

export default function TeacherSubjectsPage() {
  const { user } = useAuth();
  const teacherId = user?.userId;

  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [form, setForm] = useState({ subjectName: '', subjectCode: '', courseName: '' });

  const load = async () => {
    if (!teacherId) return;
    setIsLoading(true);
    try {
      const data = await listTeacherSubjects(teacherId);
      setSubjects(Array.isArray(data) ? data : []);
    } catch (error) {
      const detail = error?.response?.data?.message || error?.response?.data?.detail;
      toast.error(detail || 'Failed to load subjects');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherId]);

  const onAdd = async (event) => {
    event.preventDefault();
    if (!teacherId) return toast.error('Not logged in');

    const subjectName = form.subjectName.trim();
    const subjectCode = form.subjectCode.trim();
    const courseName = form.courseName.trim();

    if (!subjectName) return toast.error('Subject name is required');
    if (!subjectCode) return toast.error('Subject code is required');
    if (!courseName) return toast.error('Course name is required');

    setIsAdding(true);
    try {
      // Backend infers teacherId from JWT for TEACHER role.
      await createSubject({ subjectName, subjectCode, courseName });
      toast.success('Subject added');
      setForm({ subjectName: '', subjectCode: '', courseName: '' });
      await load();
    } catch (error) {
      const detail = error?.response?.data?.message || error?.response?.data?.detail;
      toast.error(detail || 'Failed to add subject');
    } finally {
      setIsAdding(false);
    }
  };

  const onDelete = async (subject) => {
    if (!subject?.id) return;
    const ok = window.confirm(`Delete subject "${subject.subjectName}" (${subject.subjectCode})?`);
    if (!ok) return;

    setDeletingId(subject.id);
    try {
      await deleteSubject(subject.id);
      toast.success('Subject deleted');
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to delete subject');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <SectionTitle eyebrow="Subjects" title="Teacher Subjects" description="Subjects you teach, pulled from the database." />

      <div className="card">
        <form onSubmit={onAdd} className="grid gap-3 md:grid-cols-4 md:items-end">
          <div>
            <label className="label">Subject name</label>
            <input
              className="field"
              value={form.subjectName}
              onChange={(e) => setForm((s) => ({ ...s, subjectName: e.target.value }))}
              placeholder="Data Structures"
            />
          </div>
          <div>
            <label className="label">Subject code</label>
            <input
              className="field"
              value={form.subjectCode}
              onChange={(e) => setForm((s) => ({ ...s, subjectCode: e.target.value }))}
              placeholder="CSE201"
            />
          </div>
          <div>
            <label className="label">Course</label>
            <input
              className="field"
              value={form.courseName}
              onChange={(e) => setForm((s) => ({ ...s, courseName: e.target.value }))}
              placeholder="CSE"
            />
          </div>
          <button disabled={isAdding} className="btn btn-primary mt-6 md:mt-0">
            {isAdding ? 'Adding...' : 'Add subject'}
          </button>
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {isLoading ? (
          <div className="card text-slate-300">Loading...</div>
        ) : subjects.length === 0 ? (
          <div className="card text-slate-300">No subjects assigned yet.</div>
        ) : (
          subjects.map((subject) => (
            <div key={subject.id} className="card">
              <div className="flex items-start justify-between gap-3">
                <h4 className="text-lg font-semibold text-white">{subject.subjectName}</h4>
                <button
                  type="button"
                  className="btn btn-secondary px-3 py-2 text-xs"
                  disabled={deletingId === subject.id}
                  onClick={() => onDelete(subject)}
                >
                  {deletingId === subject.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
              <p className="mt-2 text-sm text-slate-300">
                {subject.subjectCode} - {subject.courseName}
              </p>
              <p className="mt-3 text-sm text-slate-400">Students enrolled: {subject.totalStudents}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
