import api from './api';

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

export const classService = {
  getAll: (params) => api.get('/classes', { params }),
  getById: (id) => api.get(`/classes/${id}`),
  enroll: (classId) => api.post(`/classes/${classId}/enroll`),
  submitReview: (classId, data) => api.post(`/classes/${classId}/review`, data),
  getReviews: (classId) => api.get(`/classes/${classId}/reviews`),
};

export const tutorService = {
  getClasses: () => api.get('/tutor/classes'),
  createClass: (data) => api.post('/tutor/classes', data), // returns 202 with { request }
  updateClass: (id, data) => api.put(`/tutor/classes/${id}`, data),
  deleteClass: (id) => api.delete(`/tutor/classes/${id}`),
  getClassRequests: () => api.get('/tutor/class-requests'),
  deleteClassRequest: (id) => api.delete(`/tutor/class-requests/${id}`),
  getEnrollments: (classId) => api.get(`/tutor/classes/${classId}/enrollments`),
  postAnnouncement: (classId, data) => api.post(`/tutor/classes/${classId}/announcement`, data),
  getAnnouncements: (classId) => api.get(`/tutor/classes/${classId}/announcements`),
};

export const promotionService = {
  createPaymentIntent: (data) => api.post('/promotions/pay', data),
  getPromotions: () => api.get('/promotions'),
};

export const adminService = {
  getPendingTutors: () => api.get('/admin/tutors', { params: { status: 'pending' } }),
  approveTutor: (id) => api.post(`/admin/tutors/${id}/approve`),
  rejectTutor: (id) => api.post(`/admin/tutors/${id}/reject`),
  getAnalytics: () => api.get('/admin/analytics'),
  getAllClasses: (params) => api.get('/admin/classes', { params }),
  createClass: (data) => api.post('/admin/classes', data),
  updateClass: (id, data) => api.put(`/admin/classes/${id}`, data),
  deleteClass: (id) => api.delete(`/admin/classes/${id}`),
  getUsers: (params) => api.get('/admin/users', { params }),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getClassRequests: (params) => api.get('/admin/class-requests', { params }),
  approveClassRequest: (id) => api.post(`/admin/class-requests/${id}/approve`),
  rejectClassRequest: (id, data) => api.post(`/admin/class-requests/${id}/reject`, data),
  sendNotification: (data) => api.post('/notifications/send', data),
};

export const notificationService = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  registerPushToken: (token) => api.post('/notifications/token', { push_token: token }),
};
