export class NetworkClient {
  constructor(onEvent) {
    this.socket = null;
    this.onEvent = onEvent;
    this.connected = false;
    this.lastSend = 0;
    this.lastPosition = null;
    this.server = null;
    this.baseUrl = '';
    this.playerName = 'لاعب';
    this.shouldReconnect = false;
    this.reconnectAttempts = 0;
    this.reconnectTimer = null;
    this.preflight = false;
    this.generation = 0;
  }

  connect(baseUrl, server, name = 'لاعب', token = '') {
    this.close();
    if (!baseUrl) {
      this.onEvent({ type: 'offline', message: 'خدمة اللعب الجماعي غير مربوطة' });
      return;
    }
    this.baseUrl = baseUrl;
    this.server = server;
    this.playerName = String(name).slice(0, 20);
    this.token = String(token || '');
    this.shouldReconnect = true;
    this.reconnectAttempts = 0;
    this.lastSend = 0;
    this.lastPosition = null;
    this.openSocket();
  }

  async openSocket() {
    if (!this.shouldReconnect || !this.baseUrl || this.preflight) return;
    const generation = this.generation;
    if (this.token) {
      this.preflight = true;
      try {
        const check = await fetch(new URL('/api/auth/me', this.baseUrl), { headers: { authorization: 'Bearer ' + this.token, 'x-game-server': this.server } });
        if (!this.shouldReconnect || generation !== this.generation) return;
        if (!check.ok) {
          this.shouldReconnect = false;
          this.onEvent({ type: 'auth_required' });
          return;
        }
      } catch (error) {
        if (generation === this.generation) {
          this.onEvent({ type: 'network_error', message: 'تعذر التحقق من جلسة الحساب' });
          this.scheduleReconnect();
        }
        return;
      } finally { if (generation === this.generation) this.preflight = false; }
    }
    if (!this.shouldReconnect || generation !== this.generation) return;
    try {
      const url = new URL(this.baseUrl);
      if (!['https:', 'http:'].includes(url.protocol)) throw new Error('عنوان الخادم غير صالح');
      url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      url.pathname = `/ws/${this.server}`;
      url.search = '';
      url.searchParams.set('name', this.playerName);
      if (this.token) url.searchParams.set('token', this.token);
      const socket = new WebSocket(url);
      this.socket = socket;
      socket.addEventListener('open', () => {
        if (this.socket !== socket) return;
        this.connected = true;
        this.reconnectAttempts = 0;
        this.onEvent({ type: 'connected', server: this.server });
      });
      socket.addEventListener('message', event => {
        if (this.socket !== socket) return;
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'error' && data.code === 'SERVER_FULL') this.shouldReconnect = false;
          this.onEvent(data);
        } catch (error) {
          console.warn('[OneState Lite] Invalid realtime message', error);
        }
      });
      socket.addEventListener('close', event => {
        if (this.socket !== socket) return;
        this.connected = false;
        this.socket = null;
        this.onEvent({ type: 'disconnected', code: event.code, reason: event.reason });
        this.scheduleReconnect();
      });
      socket.addEventListener('error', () => {
        if (this.socket === socket) this.onEvent({ type: 'network_error' });
      });
    } catch (error) {
      this.connected = false;
      this.shouldReconnect = false;
      this.onEvent({ type: 'network_error', message: error.message || 'تعذر إنشاء الاتصال' });
    }
  }

  scheduleReconnect() {
    if (!this.shouldReconnect || this.reconnectTimer) return;
    const delay = Math.min(15000, 1000 * (2 ** Math.min(this.reconnectAttempts, 4)));
    this.reconnectAttempts += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.openSocket();
    }, delay);
  }

  move(x, z, yaw, running = false) {
    const now = performance.now();
    if (!this.connected || !this.socket || this.socket.readyState !== WebSocket.OPEN || now - this.lastSend < 100) return;
    if (this.socket.bufferedAmount > 128000) return;
    const runState=Boolean(running),previous=this.lastPosition;
    if(previous){
      const yawDelta=Math.atan2(Math.sin(yaw-previous.yaw),Math.cos(yaw-previous.yaw));
      if(Math.hypot(x-previous.x,z-previous.z)<.04&&Math.abs(yawDelta)<.025&&runState===previous.running)return;
    }
    this.lastSend = now;
    this.lastPosition={x,z,yaw,running:runState};
    try { this.socket.send(JSON.stringify({ type: 'move', x, z, yaw, running: runState })); }
    catch (error) { console.warn('[OneState Lite] Move packet failed', error); }
  }

  sendChat(message) {
    const text = String(message || '').trim().slice(0, 160);
    if (!text || !this.connected || !this.socket || this.socket.readyState !== WebSocket.OPEN) return false;
    if (this.socket.bufferedAmount > 128000) return false;
    try {
      this.socket.send(JSON.stringify({ type: 'chat', message: text }));
      return true;
    } catch (error) {
      console.warn('[OneState Lite] Chat send failed', error);
      return false;
    }
  }

  close() {
    this.generation += 1;
    this.preflight = false;
    this.shouldReconnect = false;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    const socket = this.socket;
    this.socket = null;
    this.connected = false;
    this.lastPosition = null;
    if (socket && socket.readyState < WebSocket.CLOSING) socket.close(1000, 'Leaving city');
  }
}
