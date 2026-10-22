export interface AuthUser {
  id: string;
  name: string;
  avatarColor: string;
}

export interface PartnerUser {
  id: string;
  name: string;
  avatarColor: string;
  isOnline: boolean;
  lastSeen?: number;
}

export type MessageType = 'text' | 'file' | 'audio-note' | 'system';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  type: MessageType;
  content: string; // Plaintext after local decryption
  timestamp: number;
  fileName?: string;
  fileSize?: number;
  fileMime?: string;
  fileDataUrl?: string;
  audioDuration?: number;
  isSelf: boolean;
  status: 'sent' | 'delivered' | 'read';
  expiresAt?: number; // Epoch timestamp when message self-destructs
  disappearingSeconds?: number;
}

export interface EncryptedPacket {
  version: '1.0';
  id: string;
  senderId: string;
  senderName: string;
  type: MessageType;
  ciphertext: string; // Base64
  iv: string; // Base64
  salt: string; // Base64
  timestamp: number;
  expiresAt?: number;
  disappearingSeconds?: number;
  meta?: {
    fileName?: string;
    fileSize?: number;
    fileMime?: string;
    audioDuration?: number;
  };
}

export type CallType = 'video' | 'audio';

export interface CallState {
  isActive: boolean;
  type: CallType;
  isIncoming: boolean;
  isOutgoing: boolean;
  caller?: { id: string; name: string };
  startTime?: number;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
}

export interface WebRTCConnectionStats {
  connectionState: RTCPeerConnectionState;
  iceConnectionState: RTCIceConnectionState;
  iceGatheringState: RTCIceGatheringState;
  signalingState: RTCSignalingState;
  dataChannelState: RTCDataChannelState | 'uninitialized';
  rttMs: number | null;
  bytesReceived: number;
  bytesSent: number;
  localCandidateType: string | null;
  remoteCandidateType: string | null;
  cipherSuite: string;
}

export interface Peer {
  id: string;
  name: string;
}

export interface ServerAuditReport {
  status: string;
  serverType: string;
  storagePolicy: string;
  activeOnlineUsers?: number;
  activeEphemeralRooms?: number;
  activeConnectedPeers?: number;
  storedMessagesCount: number;
  databaseEngines: string;
  diskLogPolicy: string;
  webrtcArchitecture: string;
  uptimeSeconds: number;
  timestamp: string;
}
