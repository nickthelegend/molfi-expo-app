import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '@/constants/Config';

export interface AgentActivity {
  agentId: string;
  type: 'TASK_STARTED' | 'TASK_COMPLETED' | 'TRADE_EXECUTED' | 'RESEARCH_READY';
  message: string;
  payload?: any;
  timestamp: Date;
}

export function useAgentSocket(walletAddress?: string) {
  const socketRef = useRef<Socket | null>(null);
  const [activities, setActivities] = useState<AgentActivity[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!walletAddress) return;

    // Initialize socket
    const socket = io(API_URL.replace('/api', ''), {
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected to Molfi Server');
      setIsConnected(true);
      socket.emit('subscribe', walletAddress);
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
      setIsConnected(false);
    });

    socket.on('agent_activity', (activity: AgentActivity) => {
      console.log('[Socket] New Activity:', activity);
      setActivities(prev => [activity, ...prev].slice(0, 50));
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [walletAddress]);

  return {
    activities,
    isConnected,
    socket: socketRef.current
  };
}
