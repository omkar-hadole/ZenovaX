const API_URL = import.meta.env.VITE_API_URL;

export const login = async (email, password) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'include',
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error || 'Login failed');
    Object.assign(error, data);
    throw error;
  }

  localStorage.setItem('user', JSON.stringify(data.user));
  if (data.csrfToken) {
    localStorage.setItem('csrfToken', data.csrfToken);
  }

  return data;
};

export const register = async (name, email, password) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
    credentials: 'include',
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error || 'Registration failed');
    Object.assign(error, data);
    throw error;
  }

  return data;
};

export const logout = async () => {
  try {
    const csrfToken = localStorage.getItem('csrfToken');
    const headers = {};
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }
    const response = await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers,
      credentials: 'include',
    });
    const data = await response.json();
    localStorage.removeItem('user');
    localStorage.removeItem('csrfToken');
    return data;
  } catch (error) {
    localStorage.removeItem('user');
    localStorage.removeItem('csrfToken');
    throw error;
  }
};

let authFailureHandler = null;

export const registerAuthFailureHandler = (handler) => {
  authFailureHandler = handler;
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
    ...options.headers,
  };

  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const csrfToken = localStorage.getItem('csrfToken');
  const method = (options.method || 'GET').toUpperCase();
  if (csrfToken && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  let body = options.body;
  if (body && !isFormData && typeof body !== 'string') {
    body = JSON.stringify(body);
  }

  let response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    body,
    credentials: 'include',
  });

  // Intercept 401 and attempt token refresh
  if (response.status === 401 && endpoint !== '/auth/refresh') {
    try {
      const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-CSRF-Token': csrfToken })
        },
        credentials: 'include',
      });

      if (refreshResponse.ok) {
        // Retry the original request once
        response = await fetch(`${API_URL}${endpoint}`, {
          ...options,
          headers,
          body,
          credentials: 'include',
        });
      } else {
        if (authFailureHandler) {
          authFailureHandler();
        } else {
          localStorage.removeItem('user');
          localStorage.removeItem('csrfToken');
          window.location.href = '/login';
        }
      }
    } catch (err) {
      console.error('Auto-refresh token failed:', err);
      if (authFailureHandler) {
        authFailureHandler();
      } else {
        localStorage.removeItem('user');
        localStorage.removeItem('csrfToken');
        window.location.href = '/login';
      }
    }
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
};
