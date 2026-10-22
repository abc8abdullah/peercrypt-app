/**
 * WebRTC Peer-to-Peer Manager
 * Orchestrates RTCPeerConnection, RTCDataChannel, MediaStreams (Audio/Video),
 * and ephemeral signaling with strict zero-server storage semantics.
 */

import { WebRTCConnectionStats } from '../types';

export const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
  iceCandidatePoolSize: 10,
};

export type SignalHandler = (targetPeerId: string, payload: any) => void;

export class WebRTCManager {
  public pc: RTCPeerConnection | null = null;
  public dataChannel: RTCDataChannel | null = null;
  public localStream: MediaStream | null = null;
  public remoteStream: MediaStream | null = null;
  public screenStream: MediaStream | null = null;

  private onSignal: SignalHandler;
  private onDataMessage: (data: string) => void;
  private onRemoteStreamUpdate: (stream: MediaStream | null) => void;
  private onStatsUpdate: (stats: WebRTCConnectionStats) => void;
  private onConnectionStateChange: (state: RTCPeerConnectionState) => void;

  private statsInterval: number | null = null;
  private iceCandidatesQueue: RTCIceCandidateInit[] = [];
  private remotePeerId: string | null = null;

  constructor(handlers: {
    onSignal: SignalHandler;
    onDataMessage: (data: string) => void;
    onRemoteStreamUpdate: (stream: MediaStream | null) => void;
    onStatsUpdate: (stats: WebRTCConnectionStats) => void;
    onConnectionStateChange: (state: RTCPeerConnectionState) => void;
  }) {
    this.onSignal = handlers.onSignal;
    this.onDataMessage = handlers.onDataMessage;
    this.onRemoteStreamUpdate = handlers.onRemoteStreamUpdate;
    this.onStatsUpdate = handlers.onStatsUpdate;
    this.onConnectionStateChange = handlers.onConnectionStateChange;
  }

  public setRemotePeerId(id: string | null) {
    this.remotePeerId = id;
  }

  public initializePeerConnection(isInitiator: boolean, remotePeerId: string) {
    this.cleanup();
    this.remotePeerId = remotePeerId;

    this.pc = new RTCPeerConnection(RTC_CONFIG);
    this.remoteStream = new MediaStream();

    // Setup ICE candidate dispatch
    this.pc.onicecandidate = (event) => {
      if (event.candidate && this.remotePeerId) {
        this.onSignal(this.remotePeerId, {
          type: 'ice-candidate',
          candidate: event.candidate,
        });
      }
    };

    // Connection state listeners
    this.pc.onconnectionstatechange = () => {
      if (this.pc) {
        this.onConnectionStateChange(this.pc.connectionState);
        this.collectStats();
      }
    };

    this.pc.oniceconnectionstatechange = () => {
      this.collectStats();
    };

    // Track handling for Audio/Video calls
    this.pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
      } else if (this.remoteStream) {
        this.remoteStream.addTrack(event.track);
      }
      this.onRemoteStreamUpdate(this.remoteStream);
    };

    // Pre-allocate audio & video transceivers in fixed deterministic order
    // to strictly preserve m-line ordering across all initial and subsequent SDP offers/answers.
    try {
      this.pc.addTransceiver('audio', { direction: 'sendrecv' });
      this.pc.addTransceiver('video', { direction: 'sendrecv' });
    } catch (e) {
      console.debug('Transceiver setup:', e);
    }

    // Guarded negotiation needed listener
    let isRenegotiating = false;
    this.pc.onnegotiationneeded = async () => {
      if (isRenegotiating) return;
      try {
        if (this.pc && this.pc.signalingState === 'stable') {
          isRenegotiating = true;
          await this.createOffer();
        }
      } catch (err) {
        console.warn('Renegotiation error:', err);
      } finally {
        isRenegotiating = false;
      }
    };

    // If initiator, create the RTCDataChannel
    if (isInitiator) {
      this.setupDataChannel(this.pc.createDataChannel('peercrypt-chat', {
        ordered: true,
      }));
    } else {
      this.pc.ondatachannel = (event) => {
        this.setupDataChannel(event.channel);
      };
    }

    this.startStatsMonitoring();
  }

  private setupDataChannel(channel: RTCDataChannel) {
    this.dataChannel = channel;

    this.dataChannel.onopen = () => {
      this.collectStats();
    };

    this.dataChannel.onclose = () => {
      this.collectStats();
    };

    this.dataChannel.onmessage = (event) => {
      if (typeof event.data === 'string') {
        this.onDataMessage(event.data);
      }
    };

    this.dataChannel.onerror = (err) => {
      console.warn('RTCDataChannel Error:', err);
    };
  }

  /**
   * Initiator creates an SDP Offer with consistent m-line order
   */
  public async createOffer(): Promise<void> {
    if (!this.pc || !this.remotePeerId) return;

    try {
      // Create offer with standard transceivers, avoiding legacy offerToReceive flags
      // which mutate m-line order.
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      this.onSignal(this.remotePeerId, {
        type: 'sdp-offer',
        sdp: this.pc.localDescription,
      });
    } catch (err) {
      console.error('Failed to create offer:', err);
    }
  }

  /**
   * Receiver handles SDP Offer and responds with SDP Answer
   */
  public async handleOffer(sdp: RTCSessionDescriptionInit): Promise<void> {
    if (!this.pc || !this.remotePeerId) return;

    try {
      await this.pc.setRemoteDescription(new RTCSessionDescription(sdp));

      // Process any buffered ICE candidates
      while (this.iceCandidatesQueue.length > 0) {
        const candidate = this.iceCandidatesQueue.shift();
        if (candidate) {
          await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      }

      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);

      this.onSignal(this.remotePeerId, {
        type: 'sdp-answer',
        sdp: this.pc.localDescription,
      });
    } catch (err) {
      console.error('Failed to handle offer:', err);
    }
  }

  /**
   * Initiator handles SDP Answer
   */
  public async handleAnswer(sdp: RTCSessionDescriptionInit): Promise<void> {
    if (!this.pc) return;

    try {
      await this.pc.setRemoteDescription(new RTCSessionDescription(sdp));

      // Process buffered ICE candidates
      while (this.iceCandidatesQueue.length > 0) {
        const candidate = this.iceCandidatesQueue.shift();
        if (candidate) {
          await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      }
    } catch (err) {
      console.error('Failed to handle answer:', err);
    }
  }

  /**
   * Add remote ICE candidate
   */
  public async handleIceCandidate(candidateInit: RTCIceCandidateInit): Promise<void> {
    if (!this.pc || !this.pc.remoteDescription) {
      this.iceCandidatesQueue.push(candidateInit);
      return;
    }

    try {
      await this.pc.addIceCandidate(new RTCIceCandidate(candidateInit));
    } catch (err) {
      console.warn('Error adding received ICE candidate:', err);
    }
  }

  /**
   * Send message directly through RTCDataChannel (Zero Server Storage)
   */
  public sendDataMessage(payload: string): boolean {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(payload);
      return true;
    }
    return false;
  }

  /**
   * Media management: Audio / Video with robust multi-stage device fallback.
   * Gracefully handles cases where physical camera or microphone is not found.
   */
  public async startMedia(video: boolean, audio: boolean = true): Promise<MediaStream | null> {
    let stream: MediaStream | null = null;

    // Helper to generate virtual visual/silent tracks if hardware is missing
    const createVirtualStream = (incVideo: boolean, incAudio: boolean): MediaStream => {
      const vStream = new MediaStream();

      if (incVideo) {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 640;
          canvas.height = 480;
          const ctx = canvas.getContext('2d');
          let angle = 0;

          const draw = () => {
            if (!ctx) return;
            ctx.fillStyle = '#0b0f19';
            ctx.fillRect(0, 0, 640, 480);

            // Pulsing circle
            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(320, 210, 65 + Math.sin(angle) * 8, 0, Math.PI * 2);
            ctx.stroke();

            // Avatar circle
            ctx.fillStyle = '#0891b2';
            ctx.beginPath();
            ctx.arc(320, 210, 55, 0, Math.PI * 2);
            ctx.fill();

            // User initials
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 42px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('P2P', 320, 210);

            // Virtual label
            ctx.font = 'bold 16px sans-serif';
            ctx.fillStyle = '#38bdf8';
            ctx.fillText('Virtual Avatar Stream', 320, 310);
            ctx.font = '13px sans-serif';
            ctx.fillStyle = '#64748b';
            ctx.fillText('(No Physical Camera Detected)', 320, 335);

            angle += 0.05;
          };

          const timerId = window.setInterval(draw, 1000 / 30);
          draw();
          const canvasStream = (canvas as any).captureStream ? (canvas as any).captureStream(30) : null;
          if (canvasStream) {
            const track = canvasStream.getVideoTracks()[0];
            if (track) {
              track.addEventListener('ended', () => clearInterval(timerId));
              vStream.addTrack(track);
            }
          }
        } catch (e) {
          console.debug('Virtual video creation notice:', e);
        }
      }

      if (incAudio) {
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const audioCtx = new AudioContextClass();
            const dest = audioCtx.createMediaStreamDestination();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            gain.gain.value = 0.0001; // Silent carrier
            osc.connect(gain);
            gain.connect(dest);
            osc.start();
            const audioTrack = dest.stream.getAudioTracks()[0];
            if (audioTrack) {
              vStream.addTrack(audioTrack);
            }
          }
        } catch (e) {
          console.debug('Virtual audio creation notice:', e);
        }
      }

      return vStream;
    };

    // Stage 1: Try requested devices with standard constraints
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      if (video && audio) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
        } catch (err: any) {
          console.warn('Initial video+audio getUserMedia failed:', err.name || err.message);
        }
      }

      // Stage 2: If combined failed or audio-only, try audio and video separately
      if (!stream) {
        if (video) {
          let audioTrack: MediaStreamTrack | null = null;
          let videoTrack: MediaStreamTrack | null = null;

          if (audio) {
            try {
              const aStream = await navigator.mediaDevices.getUserMedia({ audio: true });
              audioTrack = aStream.getAudioTracks()[0] || null;
            } catch (err: any) {
              console.warn('Audio fallback attempt failed:', err.name || err.message);
            }
          }

          try {
            const vStream = await navigator.mediaDevices.getUserMedia({ video: true });
            videoTrack = vStream.getVideoTracks()[0] || null;
          } catch (err: any) {
            console.warn('Video fallback attempt failed:', err.name || err.message);
          }

          if (audioTrack || videoTrack) {
            stream = new MediaStream();
            if (audioTrack) {
              stream.addTrack(audioTrack);
            } else if (audio) {
              const fallbackAudio = createVirtualStream(false, true);
              fallbackAudio.getAudioTracks().forEach(t => stream?.addTrack(t));
            }

            if (videoTrack) {
              stream.addTrack(videoTrack);
            } else {
              const fallbackVideo = createVirtualStream(true, false);
              fallbackVideo.getVideoTracks().forEach(t => stream?.addTrack(t));
            }
          }
        } else if (audio) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          } catch (err: any) {
            console.warn('Audio getUserMedia failed:', err.name || err.message);
          }
        }
      }
    }

    // Stage 3: If physical devices are completely unavailable, synthesize virtual stream
    if (!stream) {
      console.info('Using virtual media stream fallback (hardware camera/mic not found).');
      stream = createVirtualStream(video, audio);
    }

    this.localStream = stream;

    // Attach tracks to existing pre-allocated transceivers so m-line order NEVER changes
    if (this.pc) {
      const senders = this.pc.getSenders();
      for (const track of stream.getTracks()) {
        try {
          const existingSender = senders.find(s => 
            s.track?.kind === track.kind || 
            (s as any).kind === track.kind || 
            (s.track === null && (track.kind === 'audio' || track.kind === 'video'))
          );
          if (existingSender) {
            existingSender.replaceTrack(track);
          } else {
            this.pc.addTrack(track, stream);
          }
        } catch (err) {
          console.debug('PC track attachment notice:', err);
        }
      }
    }

    return stream;
  }

  public async startScreenShare(): Promise<MediaStream | null> {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      this.screenStream = screenStream;
      const screenVideoTrack = screenStream.getVideoTracks()[0];

      if (this.pc) {
        const senders = this.pc.getSenders();
        const videoSender = senders.find(s => s.track && s.track.kind === 'video');
        if (videoSender) {
          await videoSender.replaceTrack(screenVideoTrack);
        } else {
          this.pc.addTrack(screenVideoTrack, screenStream);
        }
      }

      screenVideoTrack.onended = () => {
        this.stopScreenShare();
      };

      return screenStream;
    } catch (err) {
      console.warn('User canceled or screen share failed:', err);
      return null;
    }
  }

  public async stopScreenShare(): Promise<void> {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(t => t.stop());
      this.screenStream = null;
    }

    // Revert back to local camera if available
    if (this.localStream && this.pc) {
      const cameraTrack = this.localStream.getVideoTracks()[0];
      const senders = this.pc.getSenders();
      const videoSender = senders.find(s => s.track && s.track.kind === 'video');
      if (videoSender && cameraTrack) {
        await videoSender.replaceTrack(cameraTrack);
      }
    }
  }

  public toggleMute(muted: boolean) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });
    }
  }

  public toggleVideo(videoOff: boolean) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = !videoOff;
      });
    }
  }

  public stopMedia() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
      this.screenStream = null;
    }
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => track.stop());
      this.remoteStream = null;
    }
    this.onRemoteStreamUpdate(null);
  }

  private startStatsMonitoring() {
    if (this.statsInterval) {
      window.clearInterval(this.statsInterval);
    }
    this.statsInterval = window.setInterval(() => {
      this.collectStats();
    }, 2000);
  }

  private async collectStats() {
    if (!this.pc) return;

    try {
      const stats = await this.pc.getStats();
      let rtt: number | null = null;
      let bytesRecv = 0;
      let bytesSent = 0;
      let localCandType: string | null = null;
      let remoteCandType: string | null = null;
      let cipher = 'TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256 (DTLS/SRTP)';

      stats.forEach((report) => {
        if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          if (typeof report.currentRoundTripTime === 'number') {
            rtt = Math.round(report.currentRoundTripTime * 1000);
          }
          if (report.bytesReceived) bytesRecv = report.bytesReceived;
          if (report.bytesSent) bytesSent = report.bytesSent;
        }

        if (report.type === 'local-candidate') {
          localCandType = report.candidateType;
        }
        if (report.type === 'remote-candidate') {
          remoteCandType = report.candidateType;
        }
        if (report.type === 'transport' && report.dtlsCipher) {
          cipher = `${report.dtlsCipher} (${report.srtpCipher || 'AES-CM-128'})`;
        }
      });

      this.onStatsUpdate({
        connectionState: this.pc.connectionState,
        iceConnectionState: this.pc.iceConnectionState,
        iceGatheringState: this.pc.iceGatheringState,
        signalingState: this.pc.signalingState,
        dataChannelState: this.dataChannel ? this.dataChannel.readyState : 'uninitialized',
        rttMs: rtt,
        bytesReceived: bytesRecv,
        bytesSent: bytesSent,
        localCandidateType: localCandType,
        remoteCandidateType: remoteCandType,
        cipherSuite: cipher,
      });
    } catch {
      // Ignore stats error during renegotiation/shutdown
    }
  }

  public cleanup() {
    if (this.statsInterval) {
      window.clearInterval(this.statsInterval);
      this.statsInterval = null;
    }
    this.stopMedia();
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    this.iceCandidatesQueue = [];
    this.remotePeerId = null;
  }
}
