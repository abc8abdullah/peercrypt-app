import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// Fixed 2-User credentials (customizable in-memory or on-the-fly)
const usersDatabase: Record<string, { id: string; password: string; name: string; avatarColor: string }> = {
  user1: {
    id: 'user1',
    password: 'password123',
    name: 'ইউজার ১ (User 1)',
    avatarColor: 'from-cyan-500 to-blue-600',
  },
  user2: {
    id: 'user2',
    password: 'password456',
    name: 'ইউজার ২ (User 2)',
    avatarColor: 'from-emerald-500 to-teal-600',
  },
};

// Track active connected sockets: userId -> WebSocket
const activeSockets = new Map<string, WebSocket>();

// Auth Login API
app.post('/api/auth/login', (req, res) => {
  const { userId, password } = req.body;
  if (!userId || !password) {
    return res.status(400).json({ success: false, message: 'ইউজার আইডি এবং পাসওয়ার্ড উভয়ই প্রয়োজন।' });
  }

  const cleanId = String(userId).trim().toLowerCase();
  const user = usersDatabase[cleanId];

  if (!user || user.password !== String(password).trim()) {
    return res.status(401).json({
      success: false,
      message: 'ভুল ইউজার আইডি বা পাসওয়ার্ড! অনুগ্রহ করে সঠিক তথ্য দিন।',
    });
  }

  // Identify the other peer
  const partnerId = cleanId === 'user1' ? 'user2' : 'user1';
  const partner = usersDatabase[partnerId];

  return res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      avatarColor: user.avatarColor,
    },
    partner: {
      id: partner.id,
      name: partner.name,
      avatarColor: partner.avatarColor,
      isOnline: activeSockets.has(partner.id),
    },
  });
});

// Update profile / password API
app.post('/api/auth/update', (req, res) => {
  const { userId, name, newPassword } = req.body;
  const cleanId = String(userId).trim().toLowerCase();
  const user = usersDatabase[cleanId];

  if (!user) {
    return res.status(404).json({ success: false, message: 'ইউজার পাওয়া যায়নি।' });
  }

  if (name && typeof name === 'string') {
    user.name = name.trim();
  }
  if (newPassword && typeof newPassword === 'string' && newPassword.length >= 4) {
    user.password = newPassword.trim();
  }

  // Notify the other partner if name changed
  const partnerId = cleanId === 'user1' ? 'user2' : 'user1';
  const partnerSocket = activeSockets.get(partnerId);
  if (partnerSocket && partnerSocket.readyState === WebSocket.OPEN) {
    partnerSocket.send(JSON.stringify({
      type: 'partner-updated',
      partner: {
        id: user.id,
        name: user.name,
        avatarColor: user.avatarColor,
        isOnline: activeSockets.has(user.id),
      },
    }));
  }

  return res.json({ success: true, user: { id: user.id, name: user.name, avatarColor: user.avatarColor } });
});

// WebSocket Connection handling
wss.on('connection', (ws: WebSocket) => {
  let authenticatedUserId: string | null = null;

  ws.on('message', (rawMessage: string) => {
    try {
      const msg = JSON.parse(rawMessage.toString());
      const { type, userId, targetUserId, payload } = msg;

      switch (type) {
        case 'auth-connect': {
          const cleanId = String(userId).trim().toLowerCase();
          if (!usersDatabase[cleanId]) {
            ws.send(JSON.stringify({ type: 'error', message: 'অননুমোদিত ইউজার!' }));
            return;
          }

          authenticatedUserId = cleanId;
          activeSockets.set(cleanId, ws);

          const partnerId = cleanId === 'user1' ? 'user2' : 'user1';
          const partnerSocket = activeSockets.get(partnerId);
          const isPartnerOnline = !!(partnerSocket && partnerSocket.readyState === WebSocket.OPEN);

          // Inform this user of their connection and partner's status
          ws.send(JSON.stringify({
            type: 'auth-success',
            userId: cleanId,
            partnerId,
            partnerOnline: isPartnerOnline,
            isInitiator: cleanId === 'user1', // user1 initiates WebRTC negotiation
          }));

          // Inform partner that this user is now online
          if (isPartnerOnline && partnerSocket) {
            partnerSocket.send(JSON.stringify({
              type: 'partner-status',
              userId: cleanId,
              isOnline: true,
            }));

            // Trigger initiator to start WebRTC handshake
            const initiatorSocket = activeSockets.get('user1');
            if (initiatorSocket && initiatorSocket.readyState === WebSocket.OPEN) {
              initiatorSocket.send(JSON.stringify({
                type: 'start-webrtc-handshake',
                targetUserId: 'user2',
              }));
            }
          }
          break;
        }

        case 'signal': {
          // Strictly ephemeral forwarding of WebRTC Offer / Answer / ICE Candidates
          // ZERO SERVER STORAGE: Payloads are never stored or inspected.
          if (!authenticatedUserId || !targetUserId) return;

          const targetSocket = activeSockets.get(targetUserId);
          if (targetSocket && targetSocket.readyState === WebSocket.OPEN) {
            targetSocket.send(JSON.stringify({
              type: 'signal',
              senderUserId: authenticatedUserId,
              payload,
            }));
          }
          break;
        }

        case 'screenshot-alert': {
          // Instant forward of screenshot attempt warning to the partner!
          if (!authenticatedUserId) return;
          const partnerId = authenticatedUserId === 'user1' ? 'user2' : 'user1';
          const partnerSocket = activeSockets.get(partnerId);

          if (partnerSocket && partnerSocket.readyState === WebSocket.OPEN) {
            partnerSocket.send(JSON.stringify({
              type: 'screenshot-alert-received',
              senderName: usersDatabase[authenticatedUserId]?.name || authenticatedUserId,
              timestamp: Date.now(),
            }));
          }
          break;
        }

        case 'disappearing-timer-changed': {
          if (!authenticatedUserId) return;
          const partnerId = authenticatedUserId === 'user1' ? 'user2' : 'user1';
          const partnerSocket = activeSockets.get(partnerId);

          if (partnerSocket && partnerSocket.readyState === WebSocket.OPEN) {
            partnerSocket.send(JSON.stringify({
              type: 'disappearing-timer-sync',
              timerSeconds: payload?.timerSeconds ?? 0,
              senderName: usersDatabase[authenticatedUserId]?.name || authenticatedUserId,
            }));
          }
          break;
        }

        default:
          break;
      }
    } catch (err) {
      console.error('Error in WS handler:', err);
    }
  });

  const cleanup = () => {
    if (authenticatedUserId) {
      activeSockets.delete(authenticatedUserId);
      const partnerId = authenticatedUserId === 'user1' ? 'user2' : 'user1';
      const partnerSocket = activeSockets.get(partnerId);

      if (partnerSocket && partnerSocket.readyState === WebSocket.OPEN) {
        partnerSocket.send(JSON.stringify({
          type: 'partner-status',
          userId: authenticatedUserId,
          isOnline: false,
        }));
      }
      authenticatedUserId = null;
    }
  };

  ws.on('close', cleanup);
  ws.on('error', cleanup);
});

// Server-side privacy audit endpoint
app.get('/api/server-privacy-audit', (req, res) => {
  res.json({
    status: 'online',
    serverType: 'Pure Ephemeral WebRTC Signaling Relay & 2-User Auth',
    storagePolicy: 'STRICT_ZERO_STORAGE',
    activeOnlineUsers: activeSockets.size,
    storedMessagesCount: 0,
    databaseEngines: 'None (In-memory credentials only, zero database)',
    diskLogPolicy: 'No messages, audio, or video files are written to disk. WebRTC traffic travels strictly P2P.',
    webrtcArchitecture: 'P2P Direct browser-to-browser via DTLS/SRTP and RTCDataChannel',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3000;

async function startServer() {
  server.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 PeerCrypt Telegram/WhatsApp 2-User Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
