import axios from "axios";

const API_URL = (import.meta as any).env.VITE_API_URL || "http://localhost:5000/api";

export const getJobById = async (id: string) => {
  const response = await axios.get(`${API_URL}/jobs/${id}`, { withCredentials: true });
  return response.data.job;
};

export const getAllJobs = async (params?: any) => {
  const response = await axios.get(`${API_URL}/jobs`, { params, withCredentials: true });
  return response.data.jobs;
};

export const applyToJob = async (jobId: string, payload: any) => {
  const response = await axios.post(`${API_URL}/applications`, { jobId, ...payload }, { withCredentials: true });
  return response.data;
};

export const getJobApplications = async (jobId: string) => {
  const response = await axios.get(`${API_URL}/applications/job/${jobId}`, { withCredentials: true });
  return response.data.applications;
};

export const createJob = async (data: any) => {
  const response = await axios.post(`${API_URL}/jobs`, data, { withCredentials: true });
  return response.data;
};

export const updateJob = async (id: string, data: any) => {
  const response = await axios.put(`${API_URL}/jobs/${id}`, data, { withCredentials: true });
  return response.data;
};

export const deleteJob = async (id: string) => {
  const response = await axios.delete(`${API_URL}/jobs/${id}`, { withCredentials: true });
  return response.data;
};

export const getMyJobs = async () => {
  const response = await axios.get(`${API_URL}/jobs/my/jobs`, { withCredentials: true });
  return response.data.jobs;
};