export class NetworkClient {
  constructor(onEvent) { this.socket=null; this.onEvent=onEvent; this.connected=false; this.lastSend=0; }
  connect(baseUrl, server, name='لاعب') {
    if (!baseUrl) { this.onEvent({type:'offline',message:'خادم اللعب الجماعي غير مربوط بعد'}); return; }
    const url=new URL(baseUrl);
    url.protocol=url.protocol==='https:'?'wss:':'ws:';
    url.pathname=`/ws/${server}`;
    url.searchParams.set('name',name);
    this.socket=new WebSocket(url);
    this.socket.addEventListener('open',()=>{this.connected=true;this.onEvent({type:'connected'});});
    this.socket.addEventListener('message',e=>{try{this.onEvent(JSON.parse(e.data));}catch{}});
    this.socket.addEventListener('close',()=>{this.connected=false;this.onEvent({type:'disconnected'});});
    this.socket.addEventListener('error',()=>this.onEvent({type:'network_error'}));
  }
  move(x,z,yaw) {
    const now=performance.now();
    if(!this.connected||now-this.lastSend<70)return;
    this.lastSend=now;
    this.socket.send(JSON.stringify({type:'move',x,z,yaw}));
  }
  close(){if(this.socket)this.socket.close();this.connected=false;}
}
