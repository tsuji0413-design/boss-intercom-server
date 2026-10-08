BOSS INTERCOM V1.5 - WebSocket connectivity diagnostic prototype.
1. Deploy server.js with npm install && npm start on a Node.js hosting service supporting persistent WebSockets.
2. Configure HTTPS/WSS termination with your host, then enter its wss:// endpoint in the web interface.
3. Host index.html on an HTTPS static host such as Vercel.
4. Join the same room on two devices to see participant counts and test latency.
This version does NOT transmit audio, handle PTT hardware, or provide secure authentication. Room IDs are not secure credentials. Do not use for real dispatch.
