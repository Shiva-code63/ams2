import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('ams2_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function loginRequest(payload) {
  const { data } = await api.post('/auth/login', payload);
  return data.data;
}

export async function getAdminDashboardStats() {
  const { data } = await api.get('/admin/dashboard-stats');
  return data.data;
}

export async function getAdminProfile(adminId) {
  const { data } = await api.get(`/admin/profile/${adminId}`);
  return data.data;
}

export async function updateAdminProfile(adminId, payload) {
  const { data } = await api.put(`/admin/profile/${adminId}`, payload);
  return data.data;
}

export async function changeAdminPassword(adminId, { currentPassword, newPassword }) {
  const { data } = await api.post(`/admin/change-password/${adminId}`, null, {
    params: { currentPassword, newPassword },
  });
  return data.data;
}

export async function getTeacherProfile(teacherId) {
  const { data } = await api.get(`/teachers/${teacherId}`);
  return data.data;
}

export async function updateTeacherProfile(teacherId, payload) {
  const { data } = await api.put(`/teachers/${teacherId}`, payload);
  return data.data;
}

export async function deleteTeacher(teacherId) {
  const { data } = await api.delete(`/teachers/${teacherId}`);
  return data.data;
}

export async function changeTeacherPassword(teacherId, { currentPassword, newPassword }) {
  const { data } = await api.post(`/teachers/change-password/${teacherId}`, null, {
    params: { currentPassword, newPassword },
  });
  return data.data;
}

export async function createSubject(payload) {
  const { data } = await api.post('/subjects', payload);
  return data.data;
}

export async function deleteSubject(subjectId) {
  const { data } = await api.delete(`/subjects/${subjectId}`);
  return data.data;
}

export async function generateQRSession({ subjectId }) {
  const { data } = await api.post('/qr/generate', null, {
    params: { subjectId },
  });
  return data.data;
}

export async function stopQRSession(qrToken) {
  const { data } = await api.post(`/qr/stop/${encodeURIComponent(qrToken)}`);
  return data.data;
}

export async function listSubjectStudents(subjectId) {
  const { data } = await api.get(`/subjects/${subjectId}/students`);
  return data.data;
}

export async function markAttendanceManual({ studentId, subjectId, status, date }) {
  const { data } = await api.post('/attendance/mark-manual', null, {
    params: { studentId, subjectId, status, date },
  });
  return data.data;
}

export async function listAdminStudents({ page = 0, size = 50, search } = {}) {
  const endpoint = search ? '/admin/students/search' : '/admin/students';
  const params = search ? { page, size, search } : { page, size };
  const { data } = await api.get(endpoint, { params });
  return data.data;
}

export async function createStudent(payload) {
  const { data } = await api.post('/students', payload);
  return data.data;
}

export async function listAdminTeachers({ page = 0, size = 50, search } = {}) {
  const endpoint = search ? '/admin/teachers/search' : '/admin/teachers';
  const params = search ? { page, size, search } : { page, size };
  const { data } = await api.get(endpoint, { params });
  return data.data;
}

export async function createTeacher(payload) {
  const { data } = await api.post('/teachers', payload);
  return data.data;
}

export async function listSubjects({ page = 0, size = 50, search } = {}) {
  const endpoint = search ? '/subjects/search' : '/subjects';
  const params = search ? { page, size, search } : { page, size };
  const { data } = await api.get(endpoint, { params });
  return data.data;
}

export async function listTeacherSubjects(teacherId) {
  const { data } = await api.get(`/subjects/teacher/${teacherId}`);
  return data.data;
}

export async function getStudentDashboard(studentId) {
  const { data } = await api.get(`/dashboard/student/${studentId}`);
  return data.data;
}

export async function getTeacherDashboard(teacherId) {
  const { data } = await api.get(`/dashboard/teacher/${teacherId}`);
  return data.data;
}

export async function getStudentProfile(studentId) {
  const { data } = await api.get(`/students/${studentId}`);
  return data.data;
}

export async function updateStudentProfile(studentId, payload) {
  const { data } = await api.put(`/students/${studentId}`, payload);
  return data.data;
}

export async function checkFaceRegistered(studentId) {
  const { data } = await api.get(`/face/check/${studentId}`);
  return data.data;
}

export async function registerFace(studentId, file) {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post(`/face/register/${studentId}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
}

export async function updateFace(studentId, file) {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.put(`/face/update/${studentId}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
}

export async function verifyFace(studentId, file) {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post(`/face/verify/${studentId}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
}

// New production endpoints (multi-image registration + liveness-aware verification).
export async function registerStudentFaces(files) {
  const form = new FormData();
  (files || []).forEach((f) => form.append('files', f));
  const { data } = await api.post('/student/register-face', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  });
  return data.data;
}

export async function verifyStudentFace(frames) {
  const form = new FormData();
  (frames || []).forEach((f) => form.append('frames', f));
  const { data } = await api.post('/student/verify-face', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  });
  return data.data;
}

export async function listStudentFaceImages(studentId) {
  const { data } = await api.get(`/student/face-images/${studentId}`);
  return data.data;
}

export async function deleteStudentFaces(studentId) {
  const { data } = await api.delete(`/student/delete-face/${studentId}`);
  return data.data;
}

export async function deleteStudent(studentId) {
  const { data } = await api.delete(`/students/${studentId}`);
  return data.data;
}

export async function getFaceImage(studentId) {
  const response = await api.get(`/face/image/${studentId}`, { responseType: 'blob' });
  return response.data;
}

export async function listStudentAttendance(studentId, { page = 0, size = 50 } = {}) {
  const { data } = await api.get(`/attendance/student/${studentId}`, { params: { page, size } });
  return data.data;
}

export async function searchAttendance({ page = 0, size = 50, studentId, studentEnrollmentNumber, teacherId, subjectId, date } = {}) {
  const { data } = await api.get('/attendance/search', {
    params: { page, size, studentId, studentEnrollmentNumber, teacherId, subjectId, date },
  });
  return data.data;
}

export async function exportTeacherAttendance({ subjectId } = {}) {
  const response = await api.get('/attendance/export', {
    params: { subjectId: subjectId || undefined },
    responseType: 'blob',
  });
  return response.data;
}

export async function exportStudentAttendanceReport({ studentId, startDate, endDate }) {
  const response = await api.get(`/reports/student/${encodeURIComponent(studentId)}`, {
    params: { startDate: startDate || undefined, endDate: endDate || undefined },
    responseType: 'blob',
  });
  return response.data;
}

export async function exportSubjectAttendanceReport({ subjectId, date }) {
  const response = await api.get(`/reports/subject/${encodeURIComponent(subjectId)}`, {
    params: { date },
    responseType: 'blob',
  });
  return response.data;
}

export async function exportPresentStudents({ subjectId, date }) {
  const response = await api.get('/attendance/export/present', {
    params: { subjectId, date },
    responseType: 'blob',
  });
  return response.data;
}

export async function exportSingleStudentReport({ subjectId, studentId }) {
  const response = await api.get('/attendance/export/student', {
    params: { subjectId, studentId },
    responseType: 'blob',
  });
  return response.data;
}

export async function validateQRToken(qrToken) {
  const { data } = await api.get(`/qr/validate/${encodeURIComponent(qrToken)}`);
  return data.data;
}

export async function getQRSession(qrToken) {
  const { data } = await api.get(`/qr/${encodeURIComponent(qrToken)}`);
  return data.data;
}

export async function markAttendanceByQR({ studentId, qrToken }) {
  const { data } = await api.post('/attendance/mark-qr', null, {
    params: { studentId, qrToken },
  });
  return data.data;
}

export default api;
