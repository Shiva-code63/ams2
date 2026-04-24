import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import SectionTitle from '../../components/SectionTitle';
import { exportStudentAttendanceReport, exportSubjectAttendanceReport, listAdminStudents, listSubjects, searchAttendance } from '../../services/api';

function downloadBlob({ blob, filename }) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function toNumberOrUndefined(value) {
  const trimmed = (value || '').trim();
  if (!trimmed) return undefined;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : undefined;
}

export default function AttendanceReportsPage() {
  const [filters, setFilters] = useState({ studentEnrollmentNumber: '', teacherId: '', subjectId: '', date: '' });
  const [page, setPage] = useState({ content: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [studentReport, setStudentReport] = useState({ studentId: '', startDate: '', endDate: '' });
  const [subjectReport, setSubjectReport] = useState({ subjectId: '', date: '' });

  const query = useMemo(
    () => ({
      studentEnrollmentNumber: (filters.studentEnrollmentNumber || '').trim() || undefined,
      teacherId: toNumberOrUndefined(filters.teacherId),
      subjectId: toNumberOrUndefined(filters.subjectId),
      date: (filters.date || '').trim() || undefined,
    }),
    [filters],
  );

  const loadLookups = async () => {
    try {
      const [studentPage, subjectPage] = await Promise.all([
        listAdminStudents({ page: 0, size: 200 }),
        listSubjects({ page: 0, size: 200 }),
      ]);
      setStudents(Array.isArray(studentPage?.content) ? studentPage.content : []);
      setSubjects(Array.isArray(subjectPage?.content) ? subjectPage.content : []);
    } catch {
      // Non-blocking: reports page can still work without dropdowns.
    }
  };

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await searchAttendance({ page: 0, size: 50, ...query });
      setPage(data);
    } catch {
      toast.error('Failed to load attendance');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLookups();
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onDownloadStudentWise = async () => {
    if (!studentReport.studentId) return toast.error('Select a student');
    setIsExporting(true);
    try {
      const blob = await exportStudentAttendanceReport({
        studentId: Number(studentReport.studentId),
        startDate: (studentReport.startDate || '').trim() || undefined,
        endDate: (studentReport.endDate || '').trim() || undefined,
      });
      downloadBlob({ blob, filename: `student_wise_report_${studentReport.studentId}.xlsx` });
      toast.success('Downloaded');
    } catch (error) {
      const detail = error?.response?.data?.message || error?.response?.data?.detail;
      toast.error(detail || 'Failed to download');
    } finally {
      setIsExporting(false);
    }
  };

  const onDownloadSubjectWise = async () => {
    if (!subjectReport.subjectId) return toast.error('Select a subject');
    if (!subjectReport.date) return toast.error('Select a date');
    setIsExporting(true);
    try {
      const blob = await exportSubjectAttendanceReport({ subjectId: Number(subjectReport.subjectId), date: subjectReport.date });
      downloadBlob({ blob, filename: `subject_wise_report_${subjectReport.subjectId}_${subjectReport.date}.xlsx` });
      toast.success('Downloaded');
    } catch (error) {
      const detail = error?.response?.data?.message || error?.response?.data?.detail;
      toast.error(detail || 'Failed to download');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionTitle eyebrow="Reports" title="Attendance Reports" description="Live attendance pulled from the database with basic filters." />

      <div className="card">
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <h3 className="text-lg font-semibold text-white">Student-wise Excel</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-3 md:items-end">
              <div className="md:col-span-3">
                <label className="label">Student</label>
                <select
                  className="field"
                  value={studentReport.studentId}
                  onChange={(e) => setStudentReport((s) => ({ ...s, studentId: e.target.value }))}
                  disabled={isExporting || students.length === 0}
                >
                  {students.length === 0 ? (
                    <option value="">No students</option>
                  ) : (
                    <>
                      <option value="">Select a student</option>
                      {students.map((s) => (
                        <option key={s.id} value={String(s.id)}>
                          {s.name} ({s.enrollmentNumber})
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>
              <div>
                <label className="label">Start date</label>
                <input
                  className="field"
                  type="date"
                  value={studentReport.startDate}
                  onChange={(e) => setStudentReport((s) => ({ ...s, startDate: e.target.value }))}
                  disabled={isExporting}
                />
              </div>
              <div>
                <label className="label">End date</label>
                <input
                  className="field"
                  type="date"
                  value={studentReport.endDate}
                  onChange={(e) => setStudentReport((s) => ({ ...s, endDate: e.target.value }))}
                  disabled={isExporting}
                />
              </div>
              <div className="md:col-span-3">
                <button className="btn btn-primary w-full" onClick={onDownloadStudentWise} disabled={isExporting || !studentReport.studentId}>
                  {isExporting ? 'Preparing...' : 'Download Student Report'}
                </button>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white">Subject-wise Excel</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-3 md:items-end">
              <div className="md:col-span-2">
                <label className="label">Subject</label>
                <select
                  className="field"
                  value={subjectReport.subjectId}
                  onChange={(e) => setSubjectReport((s) => ({ ...s, subjectId: e.target.value }))}
                  disabled={isExporting || subjects.length === 0}
                >
                  {subjects.length === 0 ? (
                    <option value="">No subjects</option>
                  ) : (
                    <>
                      <option value="">Select a subject</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={String(s.id)}>
                          {s.subjectName} ({s.subjectCode})
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>
              <div>
                <label className="label">Date</label>
                <input
                  className="field"
                  type="date"
                  value={subjectReport.date}
                  onChange={(e) => setSubjectReport((s) => ({ ...s, date: e.target.value }))}
                  disabled={isExporting}
                />
              </div>
              <div className="md:col-span-3">
                <button className="btn btn-secondary w-full" onClick={onDownloadSubjectWise} disabled={isExporting || !subjectReport.subjectId || !subjectReport.date}>
                  {isExporting ? 'Preparing...' : 'Download Subject Report'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="grid gap-4 md:grid-cols-5">
          <input
            className="field"
            value={filters.studentEnrollmentNumber}
            onChange={(e) => setFilters((s) => ({ ...s, studentEnrollmentNumber: e.target.value }))}
            placeholder="Enrollment Number"
          />
          <input
            className="field"
            value={filters.teacherId}
            onChange={(e) => setFilters((s) => ({ ...s, teacherId: e.target.value }))}
            placeholder="Teacher ID"
          />
          <input
            className="field"
            value={filters.subjectId}
            onChange={(e) => setFilters((s) => ({ ...s, subjectId: e.target.value }))}
            placeholder="Subject ID"
          />
          <input className="field" type="date" value={filters.date} onChange={(e) => setFilters((s) => ({ ...s, date: e.target.value }))} />
          <button className="btn btn-primary" onClick={load} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Apply'}
          </button>
        </div>
      </div>
      <div className="card overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-slate-400">
            <tr>
              <th className="py-3">Student</th>
              <th>Subject</th>
              <th>Date</th>
              <th>Status</th>
              <th>Marked By</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr className="border-t border-white/5 text-slate-200">
                <td className="py-4" colSpan={5}>
                  Loading...
                </td>
              </tr>
            ) : page.content.length === 0 ? (
              <tr className="border-t border-white/5 text-slate-200">
                <td className="py-4" colSpan={5}>
                  No records found.
                </td>
              </tr>
            ) : (
              page.content.map((row) => (
                <tr key={row.id} className="border-t border-white/5 text-slate-200">
                  <td className="py-4">
                    {row.studentName} ({row.studentEnrollmentNumber})
                  </td>
                  <td>
                    {row.subjectName} ({row.subjectCode})
                  </td>
                  <td>{row.attendanceDate}</td>
                  <td>{row.status}</td>
                  <td>{row.markedBy}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
