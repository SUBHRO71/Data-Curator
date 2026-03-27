import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
const TOKEN_KEY = 'dataset_curation_token';
const USER_KEY = 'dataset_curation_user';

const api = axios.create({
    baseURL: apiBaseUrl,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const apiMessage = error.response?.data?.error?.message;
        if (error.response?.status === 401) {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
        }
        error.message = apiMessage || error.message || 'Request failed';
        return Promise.reject(error);
    }
);

const unwrap = (response) => response.data?.data;

export const uploadDataset = async (name, files) => {
    const formData = new FormData();
    formData.append('name', name);
    Array.from(files).forEach(f => formData.append('files', f));
    
    const response = await api.post('/dataset/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return unwrap(response);
};

export const getDatasets = async () => {
    const res = await api.get('/datasets');
    return unwrap(res);
};

export const getDataset = async (id) => {
    const res = await api.get(`/dataset/${id}`);
    return unwrap(res);
};

export const getComplianceReport = async (datasetId) => {
    const res = await api.get(`/compliance/${datasetId}`);
    return unwrap(res);
};

export const updateTags = async (metadataId, tags) => {
    const res = await api.post('/metadata/update', { metadataId, tags });
    return unwrap(res);
};

export const exportDataset = async (datasetId, format) => {
    const res = await api.post('/export', { datasetId, format });
    return unwrap(res);
};

export const signup = async ({ name, email, password }) => {
    const res = await api.post('/auth/signup', { name, email, password });
    const payload = unwrap(res);
    localStorage.setItem(TOKEN_KEY, payload.token);
    localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
    return payload;
};

export const login = async ({ email, password }) => {
    const res = await api.post('/auth/login', { email, password });
    const payload = unwrap(res);
    localStorage.setItem(TOKEN_KEY, payload.token);
    localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
    return payload;
};

export const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
};

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);

export const getStoredUser = () => {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
};

export const resolveApiUrl = (path) => {
    if (/^https?:\/\//i.test(path)) {
        return path;
    }

    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    if (apiBaseUrl.startsWith('http://') || apiBaseUrl.startsWith('https://')) {
        const backendOrigin = apiBaseUrl.replace(/\/api\/?$/, '');
        return `${backendOrigin}${normalizedPath}`;
    }

    return normalizedPath;
};
