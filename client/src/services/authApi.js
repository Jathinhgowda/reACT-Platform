import apiClient from './apiClient';

export const login = async (email, password) => {
  try {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  } catch (error) {
    throw error.response.data.message || 'Login failed';
  }
};

export const register = async (username, email, password) => {
  try {
    const response = await apiClient.post('/auth/register', { username, email, password });
    return response.data;
  } catch (error) {
    throw error.response.data.message || 'Registration failed';
  }
};

export const getProfile = async () => {
  try {
    const response = await apiClient.get('/auth/me');
    return response.data;
  } catch (error) {
    throw error.response.data.message || 'Profile fetch failed';
  }
};