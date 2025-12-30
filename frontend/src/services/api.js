/**
 * API Service - Centralized API communication
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// File Upload
export const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

// AI Generation
export const generateAIEmail = async (data) => {
    // data = { job_role, experience_level, resume_file, ... }
    const response = await api.post('/api/ai/generate_email_ai', data);
    return response.data;
};

export const generateBatchEmails = async (data) => {
    const response = await api.post('/api/ai/generate_batch_emails', data);
    return response.data;
};

// ATS Analysis (New)
export const analyzeResume = async (data) => {
    // data = { resume_file, job_description }
    const response = await api.post('/api/ai/analyze_resume', data);
    return response.data;
};

// Gmail OAuth
export const getGmailAuthUrl = async () => {
    const response = await api.get('/api/auth/gmail/authorize');
    return response.data;
};

export const checkGmailStatus = async () => {
    const response = await api.get('/api/auth/gmail/status');
    return response.data;
};

export const disconnectGmail = async () => {
    const response = await api.post('/api/auth/gmail/disconnect');
    return response.data;
};

export const sendGmailTest = async (testEmail) => {
    const response = await api.post('/api/auth/gmail/test', { test_email: testEmail });
    return response.data;
};

// Email Campaign
export const sendEmails = async (config) => {
    const response = await api.post('/send_emails', config);
    return response.data;
};

export const getProgress = async () => {
    const response = await api.get('/progress');
    return response.data;
};

export const cancelEmails = async () => {
    const response = await api.post('/cancel_emails');
    return response.data;
};

export const sendTestEmail = async (data) => {
    const response = await api.post('/send_test_email', data);
    return response.data;
};

// Health Check
export const healthCheck = async () => {
    const response = await api.get('/health');
    return response.data;
};

export default api;
