import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import SectionTitle from '../../components/SectionTitle';
import { useAuth } from '../../context/AuthContext';
import { listStudentAttendance } from '../../services/api';

export default function AttendanceHistoryPage() {
  const { user } = useAuth();
  const studentId = user?.userId;

  const [page, setPage] = useState({ content: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!studentId) return;
    let active = true;
    setIsLoading(true);
    listStudentAttendance(studentId, { page: 0, size: 100 })
      .then((data) => {
        if (active) setPage(data);
      })
      .catch(() => toast.error('Failed to load attendance history'))
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [studentId]);

  return (
    <div className="space-y-6">
      <SectionTitle eyebrow="History" title="Attendance History" description="Your subject-wise records pulled from the database." />
      <div className="card overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-slate-400">
            <tr>
              <th className="py-3">Subject</th>
              <th>Date</th>
              <th>Status</th>
              <th>Marked By</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr className="border-t border-white/5 text-slate-200">
                <td className="py-4" colSpan={4}>
                  Loading...
                </td>
              </tr>
            ) : page.content.length === 0 ? (
              <tr className="border-t border-white/5 text-slate-200">
                <td className="py-4" colSpan={4}>
                  No records found.
                </td>
              </tr>
            ) : (
              page.content.map((row) => (
                <tr key={row.id} className="border-t border-white/5 text-slate-200">
                  <td className="py-4">
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
