import apiClient from './apiClient';

export const getAllIssues = async () => {
  try {
    const response = await apiClient.get('/issues');
    return response.data;
  } catch (error) {
    throw error.response.data.message || 'Failed to fetch issues';
  }
};

export const getIssueById = async (id) => {
  try {
    const response = await apiClient.get(`/issues/${id}`);
    return response.data;
  } catch (error) {
    throw error.response.data.message || 'Failed to fetch issue detail';
  }
};

export const reportNewIssue = async (formData) => {
  try {
    // Must use multipart/form-data for file uploads
    const response = await apiClient.post('/issues', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response.data.message || 'Failed to report issue';
  }
};

export const updateIssueStatus = async (id, status, comment) => {
  try {
    const response = await apiClient.put(`/issues/${id}/status`, { status, comment });
    return response.data;
  } catch (error) {
    throw error.response.data.message || 'Failed to update status';
  }
};

export const toggleVerification = async (id) => {
  try {
    const response = await apiClient.post(`/issues/${id}/verify`);
    return response.data;
  } catch (error) {
    throw error.response.data.message || 'Failed to toggle verification';
  }
};

export const addComment = async (issueId, commentText) => {
  try{
  const { data } = await apiClient.post(`/issues/${issueId}/comments`, { text: commentText });
  return data;
  } catch (error){
    throw error.response.data.message || 'Failed to post the Comment';
  }
};