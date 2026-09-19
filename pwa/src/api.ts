const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4261/api';

import { storage } from './storage';

export async function apiCall<T = any>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
  body?: any
): Promise<{ message: string; status: boolean; data: T }> {
  const token = storage.getItem('separaaltokeid');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const config: RequestInit = {
    method,
    headers,
  };
  
  if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
    config.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    if (!response.ok) {
      let errorMessage = `Error en la petición HTTP: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch (e) {
        // Ignorar si no es JSON
      }
      throw new Error(errorMessage);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API Call Error:", error);
    throw error;
  }
}
