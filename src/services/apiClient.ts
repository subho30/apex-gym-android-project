import { StorageService } from './storage';

// In local browser dev (localhost:5173), default to local server (port 4000).
// In Android APK or production builds, default to live hosted Render cloud backend.
const isLocalBrowserDev =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
  window.location.port === '5173';

const DEFAULT_API_URL = isLocalBrowserDev
  ? 'http://localhost:4000/api'
  : 'https://apex-gym-stack.onrender.com/api';

const DEFAULT_WS_URL = isLocalBrowserDev
  ? 'ws://localhost:4000/ws'
  : 'wss://apex-gym-stack.onrender.com/ws';

export const API_BASE = import.meta.env.VITE_API_URL || DEFAULT_API_URL;
export const WS_URL = import.meta.env.VITE_WS_URL || DEFAULT_WS_URL;

export async function getAuthHeader(): Promise<Record<string, string>> {
  const session = await StorageService.get<any>('apex_auth_session', null);
  if (session && session.accessToken) {
    return { Authorization: `Bearer ${session.accessToken}` };
  }
  return {};
}

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const authHeader = await getAuthHeader();
  const headers = {
    'Content-Type': 'application/json',
    ...authHeader,
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// --- Live WebSocket Client for Realtime Updates ---
type WebSocketCallback = (data: any) => void;

class RealtimeClient {
  private socket: WebSocket | null = null;
  private listeners = new Map<string, Set<WebSocketCallback>>();
  private reconnectTimer: any = null;

  constructor() {
    this.connect();
  }

  private connect() {
    if (typeof window === 'undefined') return;
    try {
      this.socket = new WebSocket(WS_URL);

      this.socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          const callbacks = this.listeners.get(parsed.event);
          if (callbacks) {
            callbacks.forEach((cb) => cb(parsed.data));
          }
        } catch {
          // Ignore parse errors
        }
      };

      this.socket.onclose = () => {
        if (!this.reconnectTimer) {
          this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
          }, 3000);
        }
      };

      this.socket.onerror = () => {
        this.socket?.close();
      };
    } catch {
      // Offline fallback
    }
  }

  public on(event: string, callback: WebSocketCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }
}

export const realtime = new RealtimeClient();
