/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { WhatsAppChat } from './components/WhatsAppChat';
import { CallOverlay } from './components/CallOverlay';
import { TechExplanationModal } from './components/TechExplanationModal';
import { SafetyNumberModal } from './components/SafetyNumberModal';
import { ServerAuditModal } from './components/ServerAuditModal';
import { SettingsModal } from './components/SettingsModal';
import { ScreenshotAlertModal } from './components/ScreenshotAlertModal';
import { WebRTCManager } from './utils/webrtcManager';
import { 
  deriveKeyFromSecret, 
  encryptData, 
  decryptData, 
  generateSafetyFingerprint 
} from './utils/crypto';
import { 
  playMessageSound, 
  startIncomingRingtone, 
  startOutgoingRing, 
  stopRingtone 
} from './utils/audioTones';
import { playSecurityAlarm } from './utils/antiScreenshotAudio';
import { 
  AuthUser, 
  PartnerUser, 
  ChatMessage, 
  EncryptedPacket, 
  CallState, 
  WebRTCConnectionStats 
} from './types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [partner, setPartner] = useState<PartnerUser | null>(null);

  // WebRTC & Connection state
  const [isPeerConnected, setIsPeerConnected] = useState<boolean>(false);
  const [stats, setStats] = useState<WebRTCConnectionStats | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Disappearing messages timer (in seconds, 0 = off)
  const [disappearingTimer, setDisappearingTimer] = useState<number>(0);

  // Anti-Screenshot states
  const [isWindowBlurred, setIsWindowBlurred] = useState<boolean>(false);
  const [isScreenshotModalOpen, setIsScreenshotModalOpen] = useState<boolean>(false);
  const [isSelfScreenshotAttempt, setIsSelfScreenshotAttempt] = useState<boolean>(false);
  const [screenshotCulpritName, setScreenshotCulpritName] = useState<string>('');

  // Call state
  const [callState, setCallState] = useState<CallState>({
    isActive: false,
    type: 'video',
    isIncoming: false,
    isOutgoing: false,
    isMuted: false,
    isVideoOff: false,
    isScreenSharing: false,
  });
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  // Security & Crypto
  const cryptoKeyRef = useRef<CryptoKey | null>(null);
  const [safetyData, setSafetyData] = useState<{ safetyNumber: string; groups: string[]; fullHash: string } | null>(null);
  const [isVerified, setIsVerified] = useState<boolean>(false);

  // Modals
  const [isTechModalOpen, setIsTechModalOpen] = useState<boolean>(false);
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState<boolean>(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isBangla, setIsBangla] = useState<boolean>(true);

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const webrtcManagerRef = useRef<WebRTCManager | null>(null);

  // Send signaling helper
  const sendSignal = useCallback((targetUserId: string, payload: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'signal',
        userId: currentUser?.id,
        targetUserId,
        payload,
      }));
    }
  }, [currentUser]);

  // Handle incoming data message from WebRTC DataChannel (Zero Server Storage)
  const handleDataChannelMessage = useCallback(async (rawPayload: string) => {
    try {
      const packet: EncryptedPacket = JSON.parse(rawPayload);
      if (!packet.ciphertext || !packet.iv || !cryptoKeyRef.current) return;

      const decryptedText = await decryptData(packet.ciphertext, packet.iv, cryptoKeyRef.current);
      playMessageSound();

      const newMsg: ChatMessage = {
        id: packet.id,
        senderId: packet.senderId,
        senderName: packet.senderName,
        type: packet.type,
        content: packet.type === 'text' ? decryptedText : '',
        timestamp: packet.timestamp,
        isSelf: false,
        status: 'delivered',
        fileName: packet.meta?.fileName,
        fileSize: packet.meta?.fileSize,
        fileMime: packet.meta?.fileMime,
        fileDataUrl: (packet.type === 'file' || packet.type === 'audio-note') ? decryptedText : undefined,
        audioDuration: packet.meta?.audioDuration,
        expiresAt: packet.expiresAt,
        disappearingSeconds: packet.disappearingSeconds,
      };

      setMessages((prev) => [...prev, newMsg]);
    } catch (err) {
      console.warn('Failed to decrypt received packet:', err);
    }
  }, []);

  // Initialize WebRTC Manager
  useEffect(() => {
    webrtcManagerRef.current = new WebRTCManager({
      onSignal: (targetPeerId, payload) => {
        sendSignal(targetPeerId, payload);
      },
      onDataMessage: (data) => {
        handleDataChannelMessage(data);
      },
      onRemoteStreamUpdate: (stream) => {
        setRemoteStream(stream);
      },
      onStatsUpdate: (newStats) => {
        setStats(newStats);
        if (newStats.dataChannelState === 'open') {
          setIsPeerConnected(true);
        } else if (newStats.dataChannelState === 'closed') {
          setIsPeerConnected(false);
        }
      },
      onConnectionStateChange: (state) => {
        if (state === 'connected') {
          setIsPeerConnected(true);
        } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
          setIsPeerConnected(false);
        }
      },
    });

    return () => {
      webrtcManagerRef.current?.cleanup();
    };
  }, [sendSignal, handleDataChannelMessage]);

  // Anti-Screenshot Event Interception
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isPrintScreen = e.key === 'PrintScreen';
      const isWindowsSnipping = e.ctrlKey && e.shiftKey && (e.key === 's' || e.key === 'S');
      const isMacScreenshot = e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key);
      const isPrintPage = (e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P');

      if (isPrintScreen || isWindowsSnipping || isMacScreenshot || isPrintPage) {
        e.preventDefault();
        e.stopPropagation();

        playSecurityAlarm();
        setIsSelfScreenshotAttempt(true);
        setIsScreenshotModalOpen(true);

        // Notify partner over WebSocket relay
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'screenshot-alert' }));
        }
      }
    };

    const handleBlur = () => {
      setIsWindowBlurred(true);
    };

    const handleFocus = () => {
      setIsWindowBlurred(false);
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Periodic Purge of Disappearing Messages whose time expired
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setMessages((prev) => prev.filter((msg) => !msg.expiresAt || msg.expiresAt > now));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Handle Login
  const handleLoginSuccess = async (user: AuthUser, initialPartner: PartnerUser) => {
    setCurrentUser(user);
    setPartner(initialPartner);

    // Derive deterministic AES-256-GCM room key for the dedicated 2-user channel
    try {
      const enc = new TextEncoder();
      const sharedSecret = 'PEERCRYPT_PAIR_USER1_USER2_SECRET_SALT';
      const salt = enc.encode('SALT_PEERCRYPT_2U').slice(0, 16);
      const key = await deriveKeyFromSecret(sharedSecret, salt);
      cryptoKeyRef.current = key;

      const fingerprint = await generateSafetyFingerprint('2-USER-PAIR', sharedSecret);
      setSafetyData(fingerprint);
    } catch (err) {
      console.error('Key derivation failed:', err);
    }

    // Connect WebSocket to Render Backend directly
    const ws = new WebSocket('wss://peercrypt-app.onrender.com/ws');
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'auth-connect',
        userId: user.id,
      }));
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'partner-status': {
            setPartner((prev) => prev ? { ...prev, isOnline: data.isOnline } : null);
            if (!data.isOnline) {
              setIsPeerConnected(false);
              stopRingtone();
              webrtcManagerRef.current?.cleanup();
            }
            break;
          }

          case 'partner-updated': {
            setPartner(data.partner);
            break;
          }

          case 'start-webrtc-handshake': {
            // User 1 initiates WebRTC negotiation with User 2
            if (webrtcManagerRef.current && data.targetUserId) {
              webrtcManagerRef.current.initializePeerConnection(true, data.targetUserId);
              await webrtcManagerRef.current.createOffer();
            }
            break;
          }

          case 'signal': {
            const { payload, senderUserId } = data;
            if (!webrtcManagerRef.current) return;

            if (payload.type === 'sdp-offer') {
              webrtcManagerRef.current.initializePeerConnection(false, senderUserId);
              await webrtcManagerRef.current.handleOffer(payload.sdp);
            } else if (payload.type === 'sdp-answer') {
              await webrtcManagerRef.current.handleAnswer(payload.sdp);
            } else if (payload.type === 'ice-candidate') {
              await webrtcManagerRef.current.handleIceCandidate(payload.candidate);
            } else if (payload.type === 'call-request') {
              startIncomingRingtone();
              setCallState((prev) => ({
                ...prev,
                type: payload.callType || 'video',
                isIncoming: true,
                isOutgoing: false,
                caller: partner || { id: senderUserId, name: 'Partner' },
              }));
            } else if (payload.type === 'call-accept') {
              stopRingtone();
              setCallState((prev) => ({
                ...prev,
                isActive: true,
                isOutgoing: false,
                startTime: Date.now(),
              }));
            } else if (payload.type === 'call-reject') {
              stopRingtone();
              webrtcManagerRef.current.stopMedia();
              setLocalStream(null);
              setCallState((prev) => ({ ...prev, isActive: false, isOutgoing: false }));
              alert(isBangla ? 'কলটি অপরজন বাতিল করেছেন।' : 'Call declined by partner.');
            } else if (payload.type === 'call-hangup') {
              stopRingtone();
              webrtcManagerRef.current.stopMedia();
              setLocalStream(null);
              setCallState((prev) => ({
                ...prev,
                isActive: false,
                isIncoming: false,
                isOutgoing: false,
                startTime: undefined,
              }));
            }
            break;
          }

          case 'screenshot-alert-received': {
            // Partner attempted screenshot!
            playSecurityAlarm();
            setIsSelfScreenshotAttempt(false);
            setScreenshotCulpritName(data.senderName || partner?.name || 'Partner');
            setIsScreenshotModalOpen(true);
            break;
          }

          case 'disappearing-timer-sync': {
            setDisappearingTimer(data.timerSeconds);
            break;
          }

          default:
            break;
        }
      } catch (err) {
        console.error('Error in WS message:', err);
      }
    };

    ws.onclose = () => {
      setIsPeerConnected(false);
    };
  };

  const handleLogout = () => {
    stopRingtone();
    webrtcManagerRef.current?.cleanup();
    if (wsRef.current) wsRef.current.close();
    setCurrentUser(null);
    setPartner(null);
    setIsPeerConnected(false);
    setMessages([]);
    setIsSettingsOpen(false);
  };

  // Change disappearing messages timer and sync with partner
  const handleSetDisappearingTimer = (seconds: number) => {
    setDisappearingTimer(seconds);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'disappearing-timer-changed',
        payload: { timerSeconds: seconds },
      }));
    }
  };

  // Send Encrypted Text Message over RTCDataChannel
  const handleSendMessage = async (text: string) => {
    if (!cryptoKeyRef.current || !webrtcManagerRef.current || !currentUser || !partner) return;

    try {
      const { ciphertext, iv } = await encryptData(text, cryptoKeyRef.current);
      const msgId = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const expiresAt = disappearingTimer > 0 ? Date.now() + disappearingTimer * 1000 : undefined;

      const packet: EncryptedPacket = {
        version: '1.0',
        id: msgId,
        senderId: currentUser.id,
        senderName: currentUser.name,
        type: 'text',
        ciphertext,
        iv,
        salt: '',
        timestamp: Date.now(),
        expiresAt,
        disappearingSeconds: disappearingTimer > 0 ? disappearingTimer : undefined,
      };

      const success = webrtcManagerRef.current.sendDataMessage(JSON.stringify(packet));

      if (success || true) {
        const selfMsg: ChatMessage = {
          id: msgId,
          senderId: currentUser.id,
          senderName: currentUser.name,
          type: 'text',
          content: text,
          timestamp: packet.timestamp,
          isSelf: true,
          status: 'sent',
          expiresAt,
          disappearingSeconds: disappearingTimer > 0 ? disappearingTimer : undefined,
        };
        setMessages((prev) => [...prev, selfMsg]);
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  // Send Encrypted Photo or File
  const handleSendFile = async (file: File) => {
    if (!cryptoKeyRef.current || !webrtcManagerRef.current || !currentUser || !partner) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      try {
        const { ciphertext, iv } = await encryptData(dataUrl, cryptoKeyRef.current!);
        const msgId = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const expiresAt = disappearingTimer > 0 ? Date.now() + disappearingTimer * 1000 : undefined;

        const packet: EncryptedPacket = {
          version: '1.0',
          id: msgId,
          senderId: currentUser.id,
          senderName: currentUser.name,
          type: 'file',
          ciphertext,
          iv,
          salt: '',
          timestamp: Date.now(),
          expiresAt,
          disappearingSeconds: disappearingTimer > 0 ? disappearingTimer : undefined,
          meta: {
            fileName: file.name,
            fileSize: file.size,
            fileMime: file.type,
          },
        };

        webrtcManagerRef.current?.sendDataMessage(JSON.stringify(packet));

        const selfMsg: ChatMessage = {
          id: msgId,
          senderId: currentUser.id,
          senderName: currentUser.name,
          type: 'file',
          content: '',
          timestamp: packet.timestamp,
          isSelf: true,
          status: 'sent',
          fileName: file.name,
          fileSize: file.size,
          fileMime: file.type,
          fileDataUrl: dataUrl,
          expiresAt,
          disappearingSeconds: disappearingTimer > 0 ? disappearingTimer : undefined,
        };
        setMessages((prev) => [...prev, selfMsg]);
      } catch (err) {
        console.error('Error sending file:', err);
      }
    };
    reader.readAsDataURL(file);
  };

  // Send Encrypted Voice Note
  const handleSendAudioNote = async (audioBlob: Blob, duration: number) => {
    if (!cryptoKeyRef.current || !webrtcManagerRef.current || !currentUser || !partner) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      try {
        const { ciphertext, iv } = await encryptData(dataUrl, cryptoKeyRef.current!);
        const msgId = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const expiresAt = disappearingTimer > 0 ? Date.now() + disappearingTimer * 1000 : undefined;

        const packet: EncryptedPacket = {
          version: '1.0',
          id: msgId,
          senderId: currentUser.id,
          senderName: currentUser.name,
          type: 'audio-note',
          ciphertext,
          iv,
          salt: '',
          timestamp: Date.now(),
          expiresAt,
          disappearingSeconds: disappearingTimer > 0 ? disappearingTimer : undefined,
          meta: { audioDuration: duration },
        };

        webrtcManagerRef.current?.sendDataMessage(JSON.stringify(packet));

        const selfMsg: ChatMessage = {
          id: msgId,
          senderId: currentUser.id,
          senderName: currentUser.name,
          type: 'audio-note',
          content: '',
          timestamp: packet.timestamp,
          isSelf: true,
          status: 'sent',
          fileDataUrl: dataUrl,
          audioDuration: duration,
          expiresAt,
          disappearingSeconds: disappearingTimer > 0 ? disappearingTimer : undefined,
        };
        setMessages((prev) => [...prev, selfMsg]);
      } catch (err) {
        console.error('Error sending audio note:', err);
      }
    };
    reader.readAsDataURL(audioBlob);
  };

  // Call Controls
  const handleStartCall = async (type: 'video' | 'audio') => {
    if (!partner || !webrtcManagerRef.current) return;

    startOutgoingRing();
    setCallState((prev) => ({ ...prev, type, isOutgoing: true, isIncoming: false }));

    const stream = await webrtcManagerRef.current.startMedia(type === 'video', true);
    setLocalStream(stream);

    sendSignal(partner.id, { type: 'call-request', callType: type });
  };

  const handleAcceptCall = async (type: 'video' | 'audio') => {
    stopRingtone();
    if (!partner || !webrtcManagerRef.current) return;

    const stream = await webrtcManagerRef.current.startMedia(type === 'video', true);
    setLocalStream(stream);

    setCallState((prev) => ({
      ...prev,
      isActive: true,
      isIncoming: false,
      startTime: Date.now(),
    }));

    sendSignal(partner.id, { type: 'call-accept' });
  };

  const handleRejectCall = () => {
    stopRingtone();
    if (partner) sendSignal(partner.id, { type: 'call-reject' });
    setCallState((prev) => ({ ...prev, isActive: false, isIncoming: false, isOutgoing: false }));
  };

  const handleEndCall = () => {
    stopRingtone();
    if (partner) sendSignal(partner.id, { type: 'call-hangup' });
    webrtcManagerRef.current?.stopMedia();
    setLocalStream(null);
    setCallState((prev) => ({
      ...prev,
      isActive: false,
      isIncoming: false,
      isOutgoing: false,
      startTime: undefined,
      isScreenSharing: false,
    }));
  };

  const handleToggleMute = () => {
    const next = !callState.isMuted;
    setCallState((prev) => ({ ...prev, isMuted: next }));
    webrtcManagerRef.current?.toggleMute(next);
  };

  const handleToggleVideo = () => {
    const next = !callState.isVideoOff;
    setCallState((prev) => ({ ...prev, isVideoOff: next }));
    webrtcManagerRef.current?.toggleVideo(next);
  };

  const handleToggleScreenShare = async () => {
    if (!webrtcManagerRef.current) return;
    if (callState.isScreenSharing) {
      await webrtcManagerRef.current.stopScreenShare();
      setCallState((prev) => ({ ...prev, isScreenSharing: false }));
    } else {
      const screen = await webrtcManagerRef.current.startScreenShare();
      if (screen) setCallState((prev) => ({ ...prev, isScreenSharing: true }));
    }
  };

  // If not logged in, render LoginScreen
  if (!currentUser || !partner) {
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        isBangla={isBangla}
        onToggleLanguage={() => setIsBangla(!isBangla)}
      />
    );
  }

  // Inside WhatsApp / Telegram App
  return (
    <div className="fixed inset-0 h-full h-[100dvh] w-full overflow-hidden bg-[#0a0e17] text-slate-100 select-none flex flex-col">
      
      {/* WhatsApp / Telegram Two-Pane Chat Area */}
      <WhatsAppChat
        currentUser={currentUser}
        partner={partner}
        isPeerConnected={isPeerConnected}
        messages={messages}
        onSendMessage={handleSendMessage}
        onSendFile={handleSendFile}
        onSendAudioNote={handleSendAudioNote}
        onStartCall={handleStartCall}
        disappearingTimer={disappearingTimer}
        onSetDisappearingTimer={handleSetDisappearingTimer}
        isWindowBlurred={isWindowBlurred}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenTechModal={() => setIsTechModalOpen(true)}
        onOpenAuditModal={() => setIsAuditModalOpen(true)}
        onOpenSafetyModal={() => setIsSafetyModalOpen(true)}
        onLogout={handleLogout}
        isBangla={isBangla}
      />

      {/* Call Overlay */}
      <CallOverlay
        callState={callState}
        remoteStream={remoteStream}
        localStream={localStream}
        remotePeerName={partner.name}
        onAcceptCall={handleAcceptCall}
        onRejectCall={handleRejectCall}
        onEndCall={handleEndCall}
        onToggleMute={handleToggleMute}
        onToggleVideo={handleToggleVideo}
        onToggleScreenShare={handleToggleScreenShare}
        isBangla={isBangla}
      />

      {/* Anti-Screenshot Alert Modal */}
      <ScreenshotAlertModal
        isOpen={isScreenshotModalOpen}
        onClose={() => setIsScreenshotModalOpen(false)}
        isSelfAttempt={isSelfScreenshotAttempt}
        culpritName={screenshotCulpritName}
        isBangla={isBangla}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentUser={currentUser}
        onUserUpdated={(updated) => setCurrentUser(updated)}
        onLogout={handleLogout}
        isBangla={isBangla}
      />

      {/* Safety Fingerprint Modal */}
      <SafetyNumberModal
        isOpen={isSafetyModalOpen}
        onClose={() => setIsSafetyModalOpen(false)}
        safetyData={safetyData}
        remotePeerName={partner.name}
        isVerified={isVerified}
        onVerifyToggle={() => setIsVerified(!isVerified)}
        isBangla={isBangla}
      />

      {/* Technical Architecture Modal */}
      <TechExplanationModal
        isOpen={isTechModalOpen}
        onClose={() => setIsTechModalOpen(false)}
        stats={stats}
        roomId="2-USER-PAIR"
        isBangla={isBangla}
      />

      {/* Server Zero-Storage Audit Modal */}
      <ServerAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        isBangla={isBangla}
      />
    </div>
  );
}