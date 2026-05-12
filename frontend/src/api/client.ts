export const API_BASE_URL = 'http://localhost:8000/api';

export const getAuthToken = () => localStorage.getItem('token');
export const setAuthToken = (token: string) => localStorage.setItem('token', token);
export const removeAuthToken = () => localStorage.removeItem('token');

interface RequestOptions extends RequestInit {
  requireAuth?: boolean;
}

export const apiFetch = async (endpoint: string, options: RequestOptions = {}) => {
  const { requireAuth = true, headers = {}, ...restOptions } = options;
  
  const token = getAuthToken();
  const authHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (requireAuth && token) {
    authHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: { ...authHeaders, ...headers },
    ...restOptions,
  });

  if (response.status === 401) {
    // Optional: handle token refresh or logout
    removeAuthToken();
    window.location.href = '/login';
    throw new Error('Non autorisé. Veuillez vous connecter.');
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || data.error || 'Erreur API');
    }
    return data;
  }

  if (!response.ok) {
    throw new Error('Erreur API');
  }

  return response.text();
};
