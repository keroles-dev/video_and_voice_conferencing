import { defineStore, acceptHMRUpdate } from 'pinia';
import { type Socket } from 'socket.io-client';
import { type Connection } from 'src/components/models';
import { createSocket } from 'src/helpers/socketFactory';
import { ref } from 'vue';

export const LOCAL_SOCKET_ID = '0';

export const useAppStore = defineStore('app', () => {
  let socket: Socket | null = null;
  let localStream: MediaStream;
  const connections = ref<Connection[]>([]);

  async function setLocalStream() {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    return localStream;
  }

  function connect() {
    socket = createSocket();
    socket.connect();
    registerSocketEvents();
  }
  function disconnect() {
    socket?.disconnect();
    socket = null;
  }

  function getConnection(sId: string) {
    return connections.value.find((c) => c.id === sId);
  }
  function addConnection(sId: string, pc: RTCPeerConnection, st: MediaStream) {
    connections.value.push({ id: sId, peer: pc, stream: st });
  }
  function removeConnection(sId: string) {
    connections.value = connections.value.filter((c) => c.id !== sId);
  }

  function establishPeerConnection(socketId: string) {
    const pc: RTCPeerConnection = new RTCPeerConnection({
      iceServers: [
        {
          urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
        },
      ],
      iceCandidatePoolSize: 10,
    });

    const stream = new MediaStream();
    addConnection(socketId, pc, stream);
    publishLocalStream(localStream, pc);
    subscribeToRemoteStream(pc, stream);

    return pc;
  }

  function closeConnection(socketId: string) {
    const c = getConnection(socketId);
    if (!c) return;

    c.peer.close();
    removeConnection(socketId);
  }

  function publishLocalStream(localStream: MediaStream, pc: RTCPeerConnection) {
    localStream.getTracks().forEach((track: MediaStreamTrack) => {
      pc.addTrack(track, localStream);
    });
  }

  function subscribeToRemoteStream(pc: RTCPeerConnection, stream: MediaStream) {
    pc.ontrack = function (this: RTCPeerConnection, ev: RTCTrackEvent) {
      ev.streams[0]?.getTracks().forEach((track: MediaStreamTrack) => {
        stream.addTrack(track);
      });
    };
  }

  function registerSocketEvents() {
    socket?.on('ON_JOIN_REQUEST', async (data: Record<string, unknown>) => {
      console.log('ON_JOIN_REQUEST');

      const socketId = data.socket_id as string;

      // create new peer connection
      const pc: RTCPeerConnection = establishPeerConnection(socketId);

      // Get candidates for sender
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket?.emit('ON_OFFER_CANDIDATE', {
            socket_id: socketId,
            candidate: event.candidate.toJSON(),
          });
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(new RTCSessionDescription(offer));

      socket?.emit('ON_OFFER_CREATED', {
        socket_id: socketId,
        offer: offer,
      });
    });

    socket?.on('ON_OFFER_CREATED', async (data: Record<string, unknown>) => {
      console.log('ON_OFFER_CREATED');

      const socketId = data.socket_id as string;

      // create new peer connection
      const pc: RTCPeerConnection = establishPeerConnection(socketId);

      // Get candidates for receiver
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket?.emit('ON_ANSWER_CANDIDATE', {
            socket_id: socketId,
            candidate: event.candidate.toJSON(),
          });
        }
      };

      await pc.setRemoteDescription(
        new RTCSessionDescription(data.offer as RTCSessionDescriptionInit),
      );

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(new RTCSessionDescription(answer));

      socket?.emit('ON_ANSWER_CREATED', {
        answer: answer,
        socket_id: socketId,
      });
    });

    socket?.on('ON_ANSWER_CREATED', async (data: Record<string, unknown>) => {
      console.log('ON_ANSWER_CREATED');

      await getConnection(data.socket_id as string)?.peer.setRemoteDescription(
        new RTCSessionDescription(data.answer as RTCSessionDescriptionInit),
      );
    });

    socket?.on('ON_OFFER_CANDIDATE', async (data: Record<string, unknown>) => {
      console.log('ON_OFFER_CANDIDATE');

      const socketId = data.socket_id as string;
      const pc = getConnection(socketId)?.peer;
      if (!pc) return;

      await pc.addIceCandidate(
        new RTCIceCandidate(data.candidate as RTCLocalIceCandidateInit | undefined),
      );
    });

    socket?.on('ON_ANSWER_CANDIDATE', async (data: Record<string, unknown>) => {
      console.log('ON_ANSWER_CANDIDATE');

      const socketId = data.socket_id;
      const pc = getConnection(socketId as string)?.peer;
      if (!pc) return;

      await pc.addIceCandidate(
        new RTCIceCandidate(data.candidate as RTCLocalIceCandidateInit | undefined),
      );
    });

    socket?.on('ON_DISCONNECTED', (data: Record<string, unknown>) => {
      const socketId = data.socket_id as string;
      console.log('ON_DISCONNECTED: ' + socketId);

      closeConnection(socketId);
    });
  }

  return {
    setLocalStream,
    connect,
    disconnect,
    connections,
    getConnection,
    establishPeerConnection,
    closeConnection,
  };
});
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAppStore, import.meta.hot));
}
