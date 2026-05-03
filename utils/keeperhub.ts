export const KEEPERHUB_API_KEY = 'kh_DTYwoaGEN3H9KU7zNU6_4GNtMG29e2Di';
export const KEEPERHUB_API_URL = 'https://app.keeperhub.com/api';

export async function keeperHubFetch(endpoint: string, options: RequestInit = {}) {
  const url = `${KEEPERHUB_API_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${KEEPERHUB_API_KEY}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || response.statusText);
    }
    
    return response.json();
  } catch (error) {
    console.error(`[KeeperHub API Error] ${endpoint}:`, error);
    throw error;
  }
}

export const keeperHub = {
  listWorkflows: () => keeperHubFetch('/workflows'),
  getWorkflow: (id: string) => keeperHubFetch(`/workflows/${id}`),
  createWorkflow: (data: any) => keeperHubFetch('/workflows', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateWorkflow: (id: string, data: any) => keeperHubFetch(`/workflows/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  deleteWorkflow: (id: string) => keeperHubFetch(`/workflows/${id}`, {
    method: 'DELETE',
  }),
  executeWorkflow: (id: string, payload?: any) => keeperHubFetch(`/workflows/${id}/execute`, {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  }),
  listActionSchemas: (category?: string) => keeperHubFetch(`/workflows/action-schemas${category ? `?category=${category}` : ''}`),
  listIntegrations: (type?: string) => keeperHubFetch(`/integrations${type ? `?type=${type}` : ''}`),
  getWalletIntegration: (id: string) => keeperHubFetch(`/integrations/web3/${id}`),
};

export const MOLFI_API_URL = 'http://localhost:3002/api';

export const molfiOrchestrator = {
  // Webhook registration for push notifications
  registerPushToken: (walletAddress: string, pushToken: string) => fetch(`${MOLFI_API_URL}/notifications/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress, pushToken }),
  }).then(res => res.json()),

  // Task Orchestrator
  listTasks: (walletAddress: string) => fetch(`${MOLFI_API_URL}/tasks?walletAddress=${walletAddress}`).then(res => res.json()),
  createTask: (data: any) => fetch(`${MOLFI_API_URL}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(res => res.json()),
  deleteTask: (id: string) => fetch(`${MOLFI_API_URL}/tasks/${id}`, {
    method: 'DELETE',
  }).then(res => res.json()),
};
