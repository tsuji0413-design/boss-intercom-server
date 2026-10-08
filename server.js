// BOSS INTERCOM V1.6: diagnostic WebSocket and HTTP server (no audio/PTT)
const http = require('http');
const fs = require('fs');
const path = require('path');
const {WebSocketServer, WebSocket} = require('ws');
const port = Number(process.env.PORT || 8080);
const server = http.createServer((req,res)=>{
  const url = new URL(req.url,'http://localhost');
  if(url.pathname === '/health') {
    res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
    return res.end(JSON.stringify({ok:true,app:'BOSS INTERCOM',version:'1.6.0',mode:'diagnostic'}));
  }
  if(url.pathname === '/') {
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});
    return fs.createReadStream(path.join(__dirname,'index.html')).pipe(res);
  }
  res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Not Found');
});
const wss = new WebSocketServer({server});
const rooms = new Map();
function broadcast(room) {
  const clients = rooms.get(room);
  if(!clients)return;
  for(const ws of clients)if(ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify({type:'presence',count:clients.size}));
}
wss.on('connection',ws=>{
  let room=null;
  ws.on('message',raw=>{
    if(raw.length>4096)return;
    let m;try{m=JSON.parse(String(raw))}catch{return}
    if(m.type==='join' && typeof m.room==='string' && m.room.length>0 && m.room.length<=32){
      if(room){rooms.get(room)?.delete(ws);if(!rooms.get(room)?.size)rooms.delete(room);else broadcast(room)}
      room=m.room;
      if(!rooms.has(room))rooms.set(room,new Set());
      rooms.get(room).add(ws);broadcast(room);
    } else if(m.type==='ping' && ws.readyState===WebSocket.OPEN){
      ws.send(JSON.stringify({type:'pong',id:String(m.id||'').slice(0,80)}));
    }
  });
  ws.on('close',()=>{
    if(room){rooms.get(room)?.delete(ws);if(!rooms.get(room)?.size)rooms.delete(room);else broadcast(room)}
  });
});
server.listen(port,'0.0.0.0',()=>console.log('BOSS INTERCOM V1.6 diagnostic server listening on '+port));
