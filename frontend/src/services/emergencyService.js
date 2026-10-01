
import axios from "axios";
import { getStoredToken } from "./authService";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const emergencyAPI = axios.create({
  baseURL: API_URL,
});

// Attach the logged-in user's JWT to every request.
emergencyAPI.interceptors.request.use(
  (config) => {
    const token = getStoredToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Create a new emergency.
export const createEmergency = async (emergencyData) => {
  const response = await emergencyAPI.post(
    "/emergencies",
    emergencyData
  );

  return response.data;
};

// Upload photo/video evidence for an existing emergency.
export const uploadEmergencyEvidence = async (
  emergencyId,
  files
) => {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("evidence", file);
  });

  const response = await emergencyAPI.post(
    `/emergencies/${emergencyId}/evidence`,
    formData
  );

  return response.data;
};

// Fetch emergencies reported by the logged-in employee.
export const getMyEmergencies = async () => {
  const response = await emergencyAPI.get("/emergencies/my");

  return response.data;
};

// Fetch a specific emergency.
export const getEmergencyById = async (emergencyId) => {
  const response = await emergencyAPI.get(
    `/emergencies/${emergencyId}`
  );

  return response.data;
};
export const cancelEmergency = async (emergencyId, cancellationReason) => {
  const response = await emergencyAPI.patch(
    `/emergencies/${emergencyId}/cancel`,
    { cancellationReason }
  );

  return response.data;
};