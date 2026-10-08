// Node.js 18+ / npm install ws
const {WebSocketServer}=require('ws');
const port=Number(process.env.PORT||8080);
const wss=new WebSocketServer({port});
const rooms=new Map();
function broadcast(room){const clients=rooms.get(room)||new Set();for(const client of clients)if(client.readyState===1)client.send(JSON.stringify({type:'presence',count:clients.size}));}
wss.on('connection',ws=>{let room=null;ws.on('message',raw=>{let m;try{m=JSON.parse(String(raw))}catch{return}if(m.type==='join'&&typeof m.room==='string'&&m.room.length<=32&&m.room.length>0){if(room){rooms.get(room)?.delete(ws);broadcast(room)}room=m.room;if(!rooms.has(room))rooms.set(room,new Set());rooms.get(room).add(ws);broadcast(room)}else if(m.type==='ping'){ws.send(JSON.stringify({type:'pong',id:String(m.id||'')}))}});ws.on('close',()=>{if(room){rooms.get(room)?.delete(ws);broadcast(room);if(!rooms.get(room)?.size)rooms.delete(room)}})});
console.log('BOSS INTERCOM diagnostic signaling server on port '+port);
