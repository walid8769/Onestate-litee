export class NetworkClient {
  constructor(onEvent) {
    this.socket = null;
    this.onEvent = onEvent;
    this.connected = false;
    this.lastSend = 0;
    this.server = null;
    this.baseUrl = '';
    this.playerName = 'لاعب';
    this.shouldReconnect = false;
    this.reconnectAttempts = 0;
    this.reconnectTimer = null;
  }

  connect(baseUrl, server, name = 'لاعب') {
    this.close();
    if (!baseUrl) {
      this.onEvent({ type: 'offline', message: 'خدمة اللعب الجماعي غير مربوطة' });
      return;
    }
    this.baseUrl = baseUrl;
    this.server = server;
    this.playerName = String(name).slice(0, 20);
    this.shouldReconnect = true;
    this.reconnectAttempts = 0;
    this.openSocket();
  }

  openSocket() {
    if (!this.shouldReconnect || !this.baseUrl) return;
    try {
      const url = new URL(this.baseUrl);
      if (!['https:', 'http:'].includes(url.protocol)) throw new Error('عنوان الخادم غير صالح');
      url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      url.pathname = `/ws/${this.server}`;
      url.search = '';
      url.searchParams.set('name', this.playerName);
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
      this.onEvent({ type: 'network_error', message: error.message || 'تعذر إنشاء الاتصال' });
      this.scheduleReconnect();
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

  move(x, z, yaw) {
    const now = performance.now();
    if (!this.connected || !this.socket || this.socket.readyState !== WebSocket.OPEN || now - this.lastSend < 70) return;
    if (this.socket.bufferedAmount > 128000) return;
    this.lastSend = now;
    try { this.socket.send(JSON.stringify({ type: 'move', x, z, yaw })); }
    catch (error) { console.warn('[OneState Lite] Move packet failed', error); }
  }

  close() {
    this.shouldReconnect = false;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    const socket = this.socket;
    this.socket = null;
    this.connected = false;
    if (socket && socket.readyState < WebSocket.CLOSING) socket.close(1000, 'Leaving city');
  }
}
