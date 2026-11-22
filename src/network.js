export class NetworkClient {
  constructor(onEvent) {
    this.socket = null;
    this.onEvent = onEvent;
    this.connected = false;
    this.lastSend = 0;
    this.server = null;
  }

  connect(baseUrl, server, name = 'لاعب') {
    this.close();
    if (!baseUrl) {
      this.onEvent({ type: 'offline', message: 'خدمة اللعب الجماعي غير مربوطة' });
      return;
    }
    try {
      const url = new URL(baseUrl);
      if (!['https:', 'http:'].includes(url.protocol)) throw new Error('عنوان الخادم غير صالح');
      url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      url.pathname = `/ws/${server}`;
      url.search = '';
      url.searchParams.set('name', String(name).slice(0, 20));
      this.server = server;
      const socket = new WebSocket(url);
      this.socket = socket;
      socket.addEventListener('open', () => {
        if (this.socket !== socket) return;
        this.connected = true;
        this.onEvent({ type: 'connected', server });
      });
      socket.addEventListener('message', event => {
        if (this.socket !== socket) return;
        try { this.onEvent(JSON.parse(event.data)); } catch (error) {
          console.warn('[OneState Lite] Invalid realtime message', error);
        }
      });
      socket.addEventListener('close', event => {
        if (this.socket !== socket) return;
        this.connected = false;
        this.onEvent({ type: 'disconnected', code: event.code, reason: event.reason });
      });
      socket.addEventListener('error', () => {
        if (this.socket === socket) this.onEvent({ type: 'network_error' });
      });
    } catch (error) {
      this.connected = false;
      this.onEvent({ type: 'network_error', message: error.message || 'تعذر إنشاء الاتصال' });
    }
  }

  move(x, z, yaw) {
    const now = performance.now();
    if (!this.connected || !this.socket || this.socket.readyState !== WebSocket.OPEN || now - this.lastSend < 70) return;
    this.lastSend = now;
    this.socket.send(JSON.stringify({ type: 'move', x, z, yaw }));
  }

  close() {
    const socket = this.socket;
    this.socket = null;
    this.connected = false;
    if (socket && socket.readyState < WebSocket.CLOSING) socket.close(1000, 'Leaving city');
  }
}
