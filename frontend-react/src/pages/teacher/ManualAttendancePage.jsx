import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Check, X } from 'lucide-react';
import SectionTitle from '../../components/SectionTitle';
import { useAuth } from '../../context/AuthContext';
import { listSubjectStudents, listTeacherSubjects, markAttendanceManual, searchAttendance } from '../../services/api';

function todayISO() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export default function ManualAttendancePage() {
  const { user } = useAuth();
  const teacherId = user?.userId;

  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState('');
  const [date, setDate] = useState(todayISO());
  const [search, setSearch] = useState('');

  const [students, setStudents] = useState([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [marking, setMarking] = useState(null); // `${studentId}:${status}`
  const [statusByStudentId, setStatusByStudentId] = useState({}); // { [id]: 'PRESENT' | 'ABSENT' }

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => {
      const name = (s?.name || '').toLowerCase();
      const enroll = (s?.enrollmentNumber || '').toLowerCase();
      const email = (s?.collegeEmail || '').toLowerCase();
      return name.includes(q) || enroll.includes(q) || email.includes(q);
    });
  }, [students, search]);

  const loadSubjects = async () => {
    if (!teacherId) return;
    setIsLoadingSubjects(true);
    try {
      const data = await listTeacherSubjects(teacherId);
      const list = Array.isArray(data) ? data : [];
      setSubjects(list);
      setSubjectId((prev) => prev || (list[0]?.id ? String(list[0].id) : ''));
    } catch (error) {
      const detail = error?.response?.data?.message || error?.response?.data?.detail;
      toast.error(detail || 'Failed to load subjects');
    } finally {
      setIsLoadingSubjects(false);
    }
  };

  const loadStudents = async (nextSubjectId) => {
    if (!nextSubjectId) {
      setStudents([]);
      setStatusByStudentId({});
      return;
    }
    setIsLoadingStudents(true);
    try {
      const data = await listSubjectStudents(nextSubjectId);
      setStudents(Array.isArray(data) ? data : []);
    } catch (error) {
      const detail = error?.response?.data?.message || error?.response?.data?.detail;
      toast.error(detail || 'Failed to load students');
      setStudents([]);
      setStatusByStudentId({});
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const loadExistingMarks = async () => {
    if (!subjectId || !date) {
      setStatusByStudentId({});
      return;
    }

    try {
      const page = await searchAttendance({ subjectId: Number(subjectId), date, page: 0, size: 5000 });
      const next = {};
      for (const item of page?.content || []) {
        if (item?.studentId && item?.status) next[item.studentId] = item.status;
      }
      setStatusByStudentId(next);
    } catch (error) {
      const detail = error?.response?.data?.message || error?.response?.data?.detail;
      toast.error(detail || 'Failed to load existing attendance');
      setStatusByStudentId({});
    }
  };

  useEffect(() => {
    loadSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherId]);

  useEffect(() => {
    loadStudents(subjectId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId]);

  useEffect(() => {
    loadExistingMarks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId, date]);

  const onMark = async (studentId, status) => {
    if (!subjectId) return toast.error('Select a subject first');
    if (!date) return toast.error('Select a date');

    setMarking(`${studentId}:${status}`);
    try {
      const item = await markAttendanceManual({ studentId, subjectId: Number(subjectId), status, date });
      if (item?.status) {
        setStatusByStudentId((prev) => ({ ...prev, [studentId]: item.status }));
      } else {
        setStatusByStudentId((prev) => ({ ...prev, [studentId]: status }));
      }
      toast.success(`Marked ${status.toLowerCase()}`);
    } catch (error) {
      const detail = error?.response?.data?.message || error?.response?.data?.detail;
      toast.error(detail || 'Failed to mark attendance');
    } finally {
      setMarking(null);
    }
  };

  return (
    <div className="space-y-6">
      <SectionTitle
        eyebrow="Attendance"
        title="Manual Attendance"
        description="Search students, mark present or absent, and remove entries when needed."
      />

      <div className="card">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="label">Search student</label>
            <input className="field" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name / enrollment / email" />
          </div>

          <div>
            <label className="label">Subject</label>
            <select
              className="field"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              disabled={isLoadingSubjects || subjects.length === 0}
            >
              {subjects.length === 0 ? (
                <option value="">No subjects assigned</option>
              ) : (
                subjects.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.subjectName}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="label">Date</label>
            <input className="field" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="card overflow-x-auto">
        {isLoadingStudents ? (
          <div className="text-slate-300">Loading students...</div>
        ) : !subjectId ? (
          <div className="text-slate-300">Select a subject to see enrolled students.</div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-slate-300">No students found for this subject.</div>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="py-3">Name</th>
                <th>Enrollment</th>
                <th>Email</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((s) => (
                <tr key={s.id} className="border-t border-white/5 text-slate-200">
                  <td className="py-4">{s.name}</td>
                  <td>{s.enrollmentNumber}</td>
                  <td>{s.collegeEmail}</td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="btn btn-primary px-3 py-2 text-xs"
                        disabled={marking === `${s.id}:PRESENT`}
                        onClick={() => onMark(s.id, 'PRESENT')}
                      >
                        <span className="inline-flex items-center gap-2">
                          {statusByStudentId[s.id] === 'PRESENT' && <Check className="h-4 w-4 text-emerald-300" />}
                          {marking === `${s.id}:PRESENT` ? 'Marking...' : 'Present'}
                        </span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary px-3 py-2 text-xs"
                        disabled={marking === `${s.id}:ABSENT`}
                        onClick={() => onMark(s.id, 'ABSENT')}
                      >
                        <span className="inline-flex items-center gap-2">
                          {marking === `${s.id}:ABSENT` ? 'Marking...' : 'Absent'}
                          {statusByStudentId[s.id] === 'ABSENT' && <X className="h-4 w-4 text-rose-300" />}
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
