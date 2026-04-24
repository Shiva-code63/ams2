import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import SectionTitle from '../../components/SectionTitle';
import { listSubjects } from '../../services/api';

export default function SubjectsPage() {
  const [page, setPage] = useState({ content: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    listSubjects({ page: 0, size: 50 })
      .then((data) => {
        if (active) setPage(data);
      })
      .catch(() => toast.error('Failed to load subjects'))
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <SectionTitle eyebrow="Subjects" title="Subject Operations" description="Add, edit, delete, and assign subjects with teacher mapping." />
      <div className="grid gap-4 md:grid-cols-2">
        {isLoading ? (
          <div className="card text-slate-300">Loading...</div>
        ) : (
          page.content.map((subject) => (
            <div key={subject.id} className="card">
              <h4 className="text-lg font-semibold text-white">{subject.subjectName}</h4>
              <p className="mt-2 text-sm text-slate-300">
                {subject.subjectCode} - {subject.courseName}
              </p>
              <p className="mt-3 text-sm text-slate-400">Teacher: {subject.teacherName}</p>
              <p className="text-sm text-slate-400">Students: {subject.totalStudents}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
