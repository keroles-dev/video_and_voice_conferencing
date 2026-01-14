import { io } from 'socket.io-client';

export function createSocket() {
  return io('http://localhost:3000', {
    autoConnect: false,
  });
}
