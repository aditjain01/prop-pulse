// Base URL for all API requests
const API_BASE_URL = 'http://localhost:5001';

// Generic API request function
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'An error occurred');
  }

  return response.json();
}

// API interface types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  email: string;
}

// API functions
export const api = {
  auth: {
    login: (credentials: LoginCredentials) => 
      apiRequest('/api/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      }),
    register: (credentials: RegisterCredentials) => 
      apiRequest('/api/register', {
        method: 'POST',
        body: JSON.stringify(credentials)
      }),
  },
  properties: {
    list: () => apiRequest('/api/properties'),
    get: (id: number) => apiRequest(`/api/properties/${id}`),
    create: (data: any) => 
      apiRequest('/api/properties', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    update: (id: number, data: any) => 
      apiRequest(`/api/properties/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
  },
  purchases: {
    list: () => apiRequest('/api/purchases'),
    get: (id: number) => apiRequest(`/api/purchases/${id}`),
    create: (data: any) => 
      apiRequest('/api/purchases', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
  },
  loans: {
    list: (purchaseId?: number) => 
      apiRequest(`/api/loans${purchaseId ? `?purchase_id=${purchaseId}` : ''}`),
    create: (data: any) => 
      apiRequest('/api/loans', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
  },
  payments: {
    list: (purchaseId?: number) => 
      apiRequest(`/api/payments${purchaseId ? `?purchase_id=${purchaseId}` : ''}`),
    create: (data: any) => 
      apiRequest('/api/payments', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
  },
  paymentSources: {
    list: () => apiRequest('/api/payment-sources'),
    create: (data: any) => 
      apiRequest('/api/payment-sources', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
  },
  loanPayments: {
    list: (loanId: number) => apiRequest(`/api/loan-payments/${loanId}`),
    create: (data: any) => apiRequest('/api/loan-payments', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
  },
};