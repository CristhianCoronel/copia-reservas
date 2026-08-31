const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4261/api';

export async function apiCall<T = any>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
  body?: any
): Promise<{ message: string; status: boolean; data: T }> {
  // Obtenemos el JWT almacenado durante el login
  const token = localStorage.getItem('token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  // Si existe el token, lo agregamos en el formato estándar Bearer
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const config: RequestInit = {
    method,
    headers,
  };
  
  // Agregamos el body solo para métodos que lo soportan
  if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
    config.body = JSON.stringify(body);
  }
  
  try {
    // Usamos fetch nativo para la petición
    const response = await fetch(`${API_URL}${endpoint}`, config);
    if (!response.ok) {
      throw new Error(`Error en la petición HTTP: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API Call Error:", error);
    throw error;
  }
}
