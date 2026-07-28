const API_URL = import.meta.env.VITE_API_URL;

let _csrfToken = null;

export const setCsrfToken = (token) => {
  _csrfToken = token;
};

export const getCsrfToken = () => {
  return _csrfToken;
};

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach(({ reject }) => reject(error));
  failedQueue = [];
};

export const login = async (email, password, rememberMe = false) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, rememberMe }),
    credentials: 'include',
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error || 'Login failed');
    Object.assign(error, data);
    throw error;
  }

  if (data.csrfToken) {
    _csrfToken = data.csrfToken;
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
    const csrfToken = _csrfToken;
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
    return data;
  } catch (error) {
    localStorage.removeItem('user');
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

  const method = (options.method || 'GET').toUpperCase();
  if (_csrfToken && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    headers['X-CSRF-Token'] = _csrfToken;
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

  // Intercept 401 and attempt token refresh with mutex
  if (response.status === 401 && endpoint !== '/auth/refresh') {
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => {
        // After refresh succeeds, retry original request
        return fetch(`${API_URL}${endpoint}`, {
          ...options,
          headers,
          body,
          credentials: 'include',
        }).then(retryResponse => {
          if (!retryResponse.ok) {
            return retryResponse.json().then(errData => {
              throw new Error(errData.error || 'Request failed');
            });
          }
          return retryResponse.json();
        });
      });
    }

    isRefreshing = true;
    let handledFailure = false;

    try {
      const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(_csrfToken && { 'X-CSRF-Token': _csrfToken })
        },
        credentials: 'include',
      });

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json().catch(() => ({}));
        if (refreshData.csrfToken) {
          _csrfToken = refreshData.csrfToken;
        }

        processQueue(null);

        // Retry the original request once with potentially updated CSRF
        const retryHeaders = { ...headers };
        if (_csrfToken && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
          retryHeaders['X-CSRF-Token'] = _csrfToken;
        }

        response = await fetch(`${API_URL}${endpoint}`, {
          ...options,
          headers: retryHeaders,
          body,
          credentials: 'include',
        });
      } else {
        handledFailure = true;
        // Clear stale refresh cookie on failure
        document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

        const error = new Error('Session expired');
        processQueue(error);

        if (authFailureHandler) {
          authFailureHandler();
        } else {
          localStorage.removeItem('user');
          window.location.href = '/auth';
        }
        throw error;
      }
    } catch (err) {
      if (handledFailure) throw err;
      if (authFailureHandler) {
        authFailureHandler();
      } else {
        localStorage.removeItem('user');
        window.location.href = '/auth';
      }
      throw err;
    } finally {
      isRefreshing = false;
    }
  }

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error || 'Request failed');
    Object.assign(error, data);
    throw error;
  }

  return data;
};
