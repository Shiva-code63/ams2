export const adminStats = {
  totalStudents: 1248,
  totalTeachers: 86,
  totalSubjects: 42,
  totalAttendanceRecords: 15620,
  averageAttendance: 81.4,
};

export const trendData = [
  { name: 'Mon', attendance: 74 },
  { name: 'Tue', attendance: 82 },
  { name: 'Wed', attendance: 78 },
  { name: 'Thu', attendance: 86 },
  { name: 'Fri', attendance: 91 },
  { name: 'Sat', attendance: 68 },
];

export const pieData = [
  { name: 'Present', value: 74 },
  { name: 'Absent', value: 26 },
];

export const monthlyData = [
  { month: 'Jan', value: 73 },
  { month: 'Feb', value: 76 },
  { month: 'Mar', value: 79 },
  { month: 'Apr', value: 82 },
  { month: 'May', value: 84 },
  { month: 'Jun', value: 81 },
];

export const students = [
  { id: 1, name: 'Aarav Sharma', enrollmentNumber: 'S25CSEU1020', collegeEmail: 's25cseu1020@bennett.edu.in', attendance: 84, course: 'CSE' },
  { id: 2, name: 'Ishita Verma', enrollmentNumber: 'S25ECEU1004', collegeEmail: 's25eceu1004@bennett.edu.in', attendance: 91, course: 'ECE' },
  { id: 3, name: 'Kabir Singh', enrollmentNumber: 'S25MECH1007', collegeEmail: 's25mech1007@bennett.edu.in', attendance: 71, course: 'ME' },
];

export const teachers = [
  { id: 1, name: 'Dr. Meera Kapoor', employeeId: 'EMP102', email: 'meera.kapoor@bennett.edu.in', subjects: 4 },
  { id: 2, name: 'Prof. Rohan Mehta', employeeId: 'EMP204', email: 'rohan.mehta@bennett.edu.in', subjects: 3 },
];

export const subjects = [
  { id: 1, subjectName: 'Data Structures', subjectCode: 'CSE201', courseName: 'CSE', teacherName: 'Dr. Meera Kapoor', totalStudents: 86 },
  { id: 2, subjectName: 'Digital Systems', subjectCode: 'ECE202', courseName: 'ECE', teacherName: 'Prof. Rohan Mehta', totalStudents: 74 },
];

export const history = [
  { subject: 'Data Structures', date: '2026-04-21', status: 'PRESENT', markedBy: 'QR' },
  { subject: 'Software Engineering', date: '2026-04-20', status: 'PRESENT', markedBy: 'MANUAL' },
  { subject: 'Operating Systems', date: '2026-04-19', status: 'ABSENT', markedBy: 'QR' },
];
