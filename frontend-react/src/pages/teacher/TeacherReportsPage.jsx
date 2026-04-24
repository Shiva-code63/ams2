import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import SectionTitle from '../../components/SectionTitle';
import { useAuth } from '../../context/AuthContext';
import {
  exportPresentStudents,
  exportSingleStudentReport,
  exportStudentAttendanceReport,
  exportSubjectAttendanceReport,
  exportTeacherAttendance,
  listSubjectStudents,
  listTeacherSubjects,
} from '../../services/api';

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

export default function TeacherReportsPage() {
  const { user } = useAuth();
  const teacherId = user?.userId;

  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState('');
  const [presentDate, setPresentDate] = useState('');
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [studentReport, setStudentReport] = useState({ studentId: '', startDate: '', endDate: '' });
  const [subjectReportDate, setSubjectReportDate] = useState('');

  useEffect(() => {
    if (!teacherId) return;
    let active = true;
    setIsLoadingSubjects(true);
    listTeacherSubjects(teacherId)
      .then((data) => {
        if (!active) return;
        const list = Array.isArray(data) ? data : [];
        setSubjects(list);
        setSubjectId('');
      })
      .catch((error) => {
        const detail = error?.response?.data?.message || error?.response?.data?.detail;
        toast.error(detail || 'Failed to load subjects');
      })
      .finally(() => {
        if (active) setIsLoadingSubjects(false);
      });

    return () => {
      active = false;
    };
  }, [teacherId]);

  useEffect(() => {
    if (!subjectId) {
      setStudents([]);
      setStudentId('');
      return;
    }

    let active = true;
    listSubjectStudents(subjectId)
      .then((data) => {
        if (!active) return;
        const list = Array.isArray(data) ? data : [];
        setStudents(list);
        setStudentId((prev) => prev || (list[0]?.id ? String(list[0].id) : ''));
      })
      .catch((error) => {
        const detail = error?.response?.data?.message || error?.response?.data?.detail;
        toast.error(detail || 'Failed to load students');
      });

    return () => {
      active = false;
    };
  }, [subjectId]);

  const selectedSubject = useMemo(() => {
    if (!subjectId) return null;
    return subjects.find((s) => String(s.id) === String(subjectId)) || null;
  }, [subjects, subjectId]);

  const fileStem = useMemo(() => {
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const subjectPart = selectedSubject?.subjectCode || 'ALL';
    return `teacher_attendance_${subjectPart}_${y}${m}${d}`;
  }, [selectedSubject]);

  const onDownloadExcel = async () => {
    setIsExporting(true);
    try {
      const blob = await exportTeacherAttendance({ subjectId: subjectId ? Number(subjectId) : undefined });
      downloadBlob({
        blob,
        filename: `${fileStem}.xlsx`,
      });
      toast.success('Downloaded');
    } catch (error) {
      const detail = error?.response?.data?.message || error?.response?.data?.detail;
      toast.error(detail || 'Failed to download');
    } finally {
      setIsExporting(false);
    }
  };

  const onDownloadPresentList = async () => {
    if (!subjectId) return toast.error('Select a subject');
    if (!presentDate) return toast.error('Select a date');

    setIsExporting(true);
    try {
      const blob = await exportPresentStudents({ subjectId: Number(subjectId), date: presentDate });
      downloadBlob({ blob, filename: `present_students_${selectedSubject?.subjectCode || subjectId}_${presentDate}.xlsx` });
      toast.success('Downloaded');
    } catch (error) {
      const detail = error?.response?.data?.message || error?.response?.data?.detail;
      toast.error(detail || 'Failed to download');
    } finally {
      setIsExporting(false);
    }
  };

  const onDownloadStudentWiseReport = async () => {
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

  const onDownloadSubjectWiseReport = async () => {
    if (!subjectId) return toast.error('Select a subject');
    if (!subjectReportDate) return toast.error('Select a date');
    setIsExporting(true);
    try {
      const blob = await exportSubjectAttendanceReport({ subjectId: Number(subjectId), date: subjectReportDate });
      downloadBlob({ blob, filename: `subject_wise_report_${selectedSubject?.subjectCode || subjectId}_${subjectReportDate}.xlsx` });
      toast.success('Downloaded');
    } catch (error) {
      const detail = error?.response?.data?.message || error?.response?.data?.detail;
      toast.error(detail || 'Failed to download');
    } finally {
      setIsExporting(false);
    }
  };

  const onDownloadSingleStudent = async () => {
    if (!subjectId) return toast.error('Select a subject');
    if (!studentId) return toast.error('Select a student');

    setIsExporting(true);
    try {
      const blob = await exportSingleStudentReport({ subjectId: Number(subjectId), studentId: Number(studentId) });
      downloadBlob({ blob, filename: `student_report_${selectedSubject?.subjectCode || subjectId}_student_${studentId}.xlsx` });
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
      <SectionTitle eyebrow="Reports" title="Teacher Reports" description="Downloadable attendance reports for your subjects and low-attendance alerts." />
      <div className="card">
        <div className="grid gap-4 md:grid-cols-3 md:items-end">
          <div className="md:col-span-2">
            <label className="label">Subject</label>
            <select
              className="field"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              disabled={isLoadingSubjects}
            >
              <option value="">All subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.subjectName} ({s.subjectCode})
                </option>
              ))}
            </select>
          </div>
          <div className="text-sm text-slate-300">
            Exports up to 5000 rows.
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <button
            className="btn btn-primary w-full md:w-auto md:px-8 md:py-2 md:text-sm"
            disabled={isExporting}
            onClick={onDownloadExcel}
          >
            {isExporting ? 'Preparing...' : 'Download Excel'}
          </button>

          <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
            <div className="w-full md:w-auto">
              <label className="label">Present date</label>
              <input
                className="field"
                type="date"
                value={presentDate}
                onChange={(e) => setPresentDate(e.target.value)}
                disabled={isExporting}
              />
            </div>
            <button className="btn btn-secondary w-full md:w-auto md:px-6 md:py-2 md:text-sm" disabled={isExporting} onClick={onDownloadPresentList}>
              {isExporting ? 'Preparing...' : 'Present list'}
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <label className="label">Single student (selected subject)</label>
            <select
              className="field"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              disabled={!subjectId || isExporting}
            >
              {students.length === 0 ? (
                <option value="">No students</option>
              ) : (
                students.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.name} ({s.enrollmentNumber})
                  </option>
                ))
              )}
            </select>
          </div>
          <button className="btn btn-secondary w-full md:w-auto md:px-6 md:py-2 md:text-sm" disabled={isExporting || !subjectId || !studentId} onClick={onDownloadSingleStudent}>
            {isExporting ? 'Preparing...' : 'Student report'}
          </button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3 md:items-end">
          <div>
            <label className="label">Student-wise report</label>
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
            <p className="mt-2 text-xs text-slate-400">Uses selected subject student list for convenience.</p>
          </div>
          <div>
            <label className="label">Start date (optional)</label>
            <input
              className="field"
              type="date"
              value={studentReport.startDate}
              onChange={(e) => setStudentReport((s) => ({ ...s, startDate: e.target.value }))}
              disabled={isExporting}
            />
          </div>
          <div>
            <label className="label">End date (optional)</label>
            <input
              className="field"
              type="date"
              value={studentReport.endDate}
              onChange={(e) => setStudentReport((s) => ({ ...s, endDate: e.target.value }))}
              disabled={isExporting}
            />
          </div>
          <button
            className="btn btn-primary w-full md:col-span-3 md:w-auto md:px-8 md:py-2 md:text-sm"
            disabled={isExporting || !studentReport.studentId}
            onClick={onDownloadStudentWiseReport}
          >
            {isExporting ? 'Preparing...' : 'Download Student-wise Report'}
          </button>
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <label className="label">Subject-wise report date</label>
            <input
              className="field"
              type="date"
              value={subjectReportDate}
              onChange={(e) => setSubjectReportDate(e.target.value)}
              disabled={isExporting}
            />
            <p className="mt-2 text-xs text-slate-400">Includes all students with PRESENT/ABSENT.</p>
          </div>
          <button
            className="btn btn-secondary w-full md:w-auto md:px-6 md:py-2 md:text-sm"
            disabled={isExporting || !subjectId || !subjectReportDate}
            onClick={onDownloadSubjectWiseReport}
          >
            {isExporting ? 'Preparing...' : 'Download Subject-wise Report'}
          </button>
        </div>
      </div>
    </div>
  );
}
