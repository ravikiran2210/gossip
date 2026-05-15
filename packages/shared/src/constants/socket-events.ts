/**
 * Shared Socket.IO event name constants.
 * Import from here in both backend (NestJS) and frontend (Next.js).
 * Never hardcode event strings in multiple places.
 */

export const SOCKET_EVENTS = {
  // ── Client → Server ──────────────────────────────────────
  MESSAGE_SEND: 'message.send',
  MESSAGE_DELIVERED: 'message.delivered',
  MESSAGE_READ: 'message.read',
  TYPING_START: 'typing.start',
  TYPING_STOP: 'typing.stop',
  CONVERSATION_JOIN: 'conversation.join',
  CONVERSATION_LEAVE: 'conversation.leave',

  // ── Server → Client ──────────────────────────────────────
  MESSAGE_SENT: 'message.sent',        // ack to sender
  MESSAGE_NEW: 'message.new',          // to receivers
  MESSAGE_DELIVERED_ACK: 'message.delivered', // receipt fan-out
  MESSAGE_READ_ACK: 'message.read',    // receipt fan-out
  TYPING_STARTED: 'typing.start',      // fan-out
  TYPING_STOPPED: 'typing.stop',       // fan-out
  CONVERSATION_CREATED: 'conversation.created',
  CONVERSATION_UPDATED: 'conversation.updated',
  GROUP_MEMBER_ADDED: 'group.member.added',
  GROUP_MEMBER_REMOVED: 'group.member.removed',
  GROUP_MEMBER_LEFT: 'group.member.left',
  SOCKET_ERROR: 'socket.error',
} as const;

export type SocketEvent = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];
