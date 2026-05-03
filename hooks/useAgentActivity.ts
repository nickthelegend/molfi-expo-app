import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '@/constants/Config';

export interface AgentActivity {
  agentId: string;
  type: 'TASK_STARTED' | 'RESEARCH_STARTED' | 'RESEARCH_COMPLETED' | 'TRADE_EXECUTED';
  message: string;
  data?: any;
  timestamp: string;
}

export function useAgentActivity(walletAddress: string | undefined) {
  const [activities, setActivities] = useState<AgentActivity[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!walletAddress) return;

    // Connect to the API socket server
    const socketUrl = API_URL.replace('/api', '');
    const newSocket = io(socketUrl);

    newSocket.on('connect', () => {
      console.log('[Socket] Connected to backend');
      newSocket.emit('subscribe', walletAddress);
    });

    newSocket.on('agent_activity', (activity: AgentActivity) => {
      console.log('[Socket] New Activity:', activity);
      setActivities((prev) => [activity, ...prev].slice(0, 50));
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [walletAddress]);

  return { activities, socket };
}
