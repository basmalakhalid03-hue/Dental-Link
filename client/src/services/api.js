import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authAPI = {
  login:    (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe:    ()     => api.get('/auth/me'),
  updateMe: (data) => api.put('/auth/me', data),
  getUsers: ()     => api.get('/auth/users'),
};

// Cases
export const casesAPI = {
  getAll:       (params) => api.get('/cases', { params }),
  getById:      (id)     => api.get(`/cases/${id}`),
  create:       (data)   => api.post('/cases', data),
  update:       (id, data) => api.put(`/cases/${id}`, data),
  delete:       (id)     => api.delete(`/cases/${id}`),
  getDashboard: ()       => api.get('/cases/dashboard'),
};

// Steps
export const stepsAPI = {
  getCaseSteps: (caseId) => api.get(`/steps/case/${caseId}`),
  complete:     (stepId) => api.put(`/steps/${stepId}/complete`),
  addNote:      (stepId, data) => api.post(`/steps/${stepId}/notes`, data),
  getWorkflow:  (type)   => api.get('/steps/workflow', { params: { type } }),
};

// Admin
export const adminAPI = {
  getUsers:           ()          => api.get('/admin/users'),
  createUser:         (data)      => api.post('/admin/users', data),
  updateUser:         (id, data)  => api.put(`/admin/users/${id}`, data),
  deleteUser:         (id)        => api.delete(`/admin/users/${id}`),
  suggestTechnician:  ()          => api.get('/admin/suggest-technician'),
  getWorkload:        ()          => api.get('/admin/workload'),
};

// Delivery
export const deliveryAPI = {
  getCases:         ()             => api.get('/delivery/cases'),
  updateStatus:     (id, status)   => api.put(`/delivery/cases/${id}/status`, { deliveryStatus: status }),
  getStats:         ()             => api.get('/delivery/stats'),
};

// Crown Types
export const crownTypeAPI = {
  getAll:   (includeInactive = false) =>
    api.get('/crown-types', { params: includeInactive ? { includeInactive: 'true' } : {} }),
  create:   (data)      => api.post('/crown-types', data),
  update:   (id, data)  => api.put(`/crown-types/${id}`, data),
  delete:   (id)        => api.delete(`/crown-types/${id}`),
  reorder:  (types)     => api.put('/crown-types/reorder', { types }),
};

// Workflow Templates
export const workflowAPI = {
  getSteps:    (type, includeInactive = false) =>
    api.get('/workflow/steps', { params: { type, includeInactive: includeInactive ? 'true' : undefined } }),
  createStep:  (data)      => api.post('/workflow/steps', data),
  updateStep:  (id, data)  => api.put(`/workflow/steps/${id}`, data),
  deleteStep:  (id)        => api.delete(`/workflow/steps/${id}`),
  reorderSteps:(steps)     => api.put('/workflow/steps/reorder', { steps }),
};

// Files
export const filesAPI = {
  upload: (caseId, file, onProgress) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post(`/files/cases/${caseId}/upload`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
      },
    });
  },
  getCaseFiles: (caseId)  => api.get(`/files/cases/${caseId}`),
  delete:       (fileId)  => api.delete(`/files/${fileId}`),
};

export default api;
