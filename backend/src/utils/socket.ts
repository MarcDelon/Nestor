import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer | null = null;

export const setIO = (ioInstance: SocketIOServer) => {
  io = ioInstance;
};

export const getIO = (): SocketIOServer | null => io;

// Emit a notification event to a specific client or agency room
export const emitNotification = (
  targetType: 'client' | 'agency',
  targetId: string | number,
  notification: any
) => {
  if (!io) return;
  const room = `${targetType}_${targetId}`;
  io.to(room).emit('notification', notification);
};
