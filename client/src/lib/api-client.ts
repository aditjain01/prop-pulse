// Mock data for initial frontend development
const MOCK_DATA = {
  users: [
    { id: 1, username: 'testuser', email: 'test@example.com' }
  ],
  properties: [
    {
      id: 1,
      title: 'Luxury Apartment',
      address: '123 Main St',
      property_type: 'Apartment',
      carpet_area: 1200,
      super_area: 1500,
      floor_number: 5,
      parking_details: '2 covered spots',
      amenities: ['gym', 'pool'],
      initial_rate: 5000000,
      current_price: 5500000,
      status: 'available'
    }
  ],
  purchases: [
    {
      id: 1,
      property_id: 1,
      purchase_date: '2024-03-01',
      registration_date: '2024-03-15',
      possession_date: null,
      final_purchase_price: 5500000,
      seller_info: 'John Doe',
      remarks: 'Good deal'
    }
  ],
  loans: [
    {
      id: 1,
      bank_name: 'Example Bank',
      loan_amount: 4000000,
      interest_rate: 7.5,
      emi_amount: 35000,
      tenure_months: 240
    }
  ],
  payments: [
    {
      id: 1,
      milestone: 'Booking Amount',
      payment_date: '2024-03-01',
      amount: 500000,
      payment_mode: 'RTGS',
      source: 'Savings Account'
    }
  ]
};

// Generic API request function that returns mock data for now
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Mock the API responses based on the endpoint
  const path = endpoint.split('?')[0]; // Remove query params for mock data matching

  if (path === '/api/properties') {
    return MOCK_DATA.properties as unknown as T;
  }
  if (path.startsWith('/api/properties/')) {
    const id = parseInt(path.split('/').pop() || '0');
    return MOCK_DATA.properties.find(p => p.id === id) as unknown as T;
  }
  if (path === '/api/purchases') {
    return MOCK_DATA.purchases as unknown as T;
  }
  if (path.startsWith('/api/purchases/')) {
    const id = parseInt(path.split('/').pop() || '0');
    return MOCK_DATA.purchases.find(p => p.id === id) as unknown as T;
  }
  if (path === '/api/loans') {
    return MOCK_DATA.loans as unknown as T;
  }
  if (path === '/api/payments') {
    return MOCK_DATA.payments as unknown as T;
  }

  throw new Error('Endpoint not mocked');
}

// API interface types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  email: string;
}

// API functions with mock implementations
export const api = {
  auth: {
    login: async (credentials: LoginCredentials) => {
      // Mock successful login
      return {
        user: MOCK_DATA.users[0],
        token: 'mock-token'
      };
    },
    register: async (credentials: RegisterCredentials) => {
      // Mock successful registration
      return {
        user: MOCK_DATA.users[0],
        token: 'mock-token'
      };
    },
  },
  properties: {
    list: () => apiRequest('/api/properties'),
    get: (id: number) => apiRequest(`/api/properties/${id}`),
    create: (data: any) => apiRequest('/api/properties', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    update: (id: number, data: any) => apiRequest(`/api/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  },
  purchases: {
    list: () => apiRequest('/api/purchases'),
    get: (id: number) => apiRequest(`/api/purchases/${id}`),
    create: (data: any) => apiRequest('/api/purchases', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  },
  loans: {
    list: (purchaseId?: number) => 
      apiRequest(`/api/loans${purchaseId ? `?purchase_id=${purchaseId}` : ''}`),
    create: (data: any) => apiRequest('/api/loans', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  },
  payments: {
    list: (purchaseId?: number) => 
      apiRequest(`/api/payments${purchaseId ? `?purchase_id=${purchaseId}` : ''}`),
    create: (data: any) => apiRequest('/api/payments', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  }
};