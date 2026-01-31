const API_URL = import.meta.env.VITE_API_URL;

const getToken = () => localStorage.getItem('token');

const getAuthHeader = () => {
  const token = getToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const login = async (email, password) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error || 'Login failed');
    Object.assign(error, data);
    throw error;
  }

  if (data.token) {
    localStorage.setItem('token', data.token);
  }
  localStorage.setItem('user', JSON.stringify(data.user));

  return data;
};

export const register = async (name, email, password) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error || 'Registration failed');
    Object.assign(error, data);
    throw error;
  }

  return data;
};

export const apiCall = async (endpoint, methodOrOptions = {}, bodyData = null) => {
  let options = {};

  if (typeof methodOrOptions === 'string') {
    options = { method: methodOrOptions };
    if (bodyData) {
      options.body = bodyData;
    }
  } else {
    options = methodOrOptions || {};
  }

  const isFormData = options.body instanceof FormData;

  const headers = {
    ...getAuthHeader(),
    ...options.headers,
  };

  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  let body = options.body;
  if (body && !isFormData && typeof body !== 'string') {
    body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    body,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
};
