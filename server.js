const http=require('http'),fs=require('fs'),path=require('path');
const {WebSocketServer,WebSocket}=require('ws');
const PORT=Number(process.env.PORT||8080);
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/health'){res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});return res.end(JSON.stringify({ok:true,app:'BOSS INTERCOM',version:'1.9.0',mode:'webrtc-audio-diagnostics'}));}
 if(url.pathname==='/'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});return fs.createReadStream(path.join(__dirname,'index.html')).pipe(res);}
 res.writeHead(404);res.end('Not Found');
});
const wss=new WebSocketServer({server,maxPayload:32768});const rooms=new Map();let serial=0;
function send(ws,m){if(ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify(m));}
function announce(room){const peers=rooms.get(room);if(!peers)return;for(const peer of peers)send(peer,{type:'presence',count:peers.size});}
function leave(ws){const room=ws.room;if(!room)return;const peers=rooms.get(room);if(peers){peers.delete(ws);for(const peer of peers)send(peer,{type:'peer-left',id:ws.id});if(!peers.size)rooms.delete(room);else announce(room);}ws.room=null;}
wss.on('connection',ws=>{
 ws.id='p'+(++serial);ws.room=null;ws.isAlive=true;
 ws.on('pong',()=>ws.isAlive=true);
 ws.on('message',raw=>{let m;try{m=JSON.parse(String(raw));}catch{return;}
  if(m.type==='join'){
   if(typeof m.room!=='string'||!/^[-A-Za-z0-9_]{4,32}$/.test(m.room))return send(ws,{type:'error',message:'ペア番号は英数字4〜32文字で入力してください'});
   leave(ws);let peers=rooms.get(m.room);if(!peers){peers=new Set();rooms.set(m.room,peers);}
   if(peers.size>=2)return send(ws,{type:'error',message:'V1.9は2台までのテスト版です'});
   ws.room=m.room;send(ws,{type:'joined',id:ws.id,peers:[...peers].map(x=>x.id)});peers.add(ws);announce(ws.room);
  }else if(m.type==='signal'&&ws.room&&typeof m.to==='string'&&m.data&&typeof m.data==='object'){
   const peer=[...(rooms.get(ws.room)||[])].find(x=>x.id===m.to);
   if(peer&&JSON.stringify(m.data).length<16000)send(peer,{type:'signal',from:ws.id,data:m.data});
  }else if(m.type==='ping')send(ws,{type:'pong',id:String(m.id||'').slice(0,80)});
 });
 ws.on('close',()=>leave(ws));ws.on('error',()=>leave(ws));
});
setInterval(()=>{for(const ws of wss.clients){if(!ws.isAlive){ws.terminate();continue;}ws.isAlive=false;ws.ping();}},30000);
server.listen(PORT,'0.0.0.0',()=>console.log('BOSS INTERCOM V1.9 WebRTC signaling on '+PORT));
