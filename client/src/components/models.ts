export interface Connection {
  id: string;
  peer: RTCPeerConnection;
  stream: MediaStream;
}
