import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { ChatMessage } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private api = environment.apiUrl;
  private socket!: Socket;
  messages = signal<ChatMessage[]>([]);
  adminId = signal<string | null>(null);
  adminInfo = signal<any>(null);
  onlineUsers = signal<string[]>([]);

  constructor(private http: HttpClient) {}

  connect(userId: string) {
    this.socket = io(environment.socketUrl || window.location.origin, {
      transports: ['websocket', 'polling']
    });
    this.socket.emit('user_connected', userId);

    this.socket.on('receive_message', (msg: ChatMessage) => {
      this.messages.update(m => [...m, msg]);
    });
    this.socket.on('message_sent', (msg: any) => {
      // Confirmation from server - already added optimistically
    });
    this.socket.on('online_users', (users: string[]) => {
      this.onlineUsers.set(users);
    });
  }

  disconnect() {
    this.socket?.disconnect();
  }

  sendMessage(data: { receiverId: string; message: string; senderId: string; senderName: string; senderPic?: string }) {
    this.socket.emit('send_message', data);
    // Save to DB
    this.http.post(`${this.api}/chat`, {
      receiver_id: data.receiverId,
      message: data.message
    }).subscribe();
  }

  loadHistory(userId: string) {
    return this.http.get<ChatMessage[]>(`${this.api}/chat/history/${userId}`).pipe();
  }

  getAdminId() {
    return this.http.get<any>(`${this.api}/chat/admin-id`);
  }

  getConversations() {
    return this.http.get<any[]>(`${this.api}/chat/conversations`);
  }

  markRead(senderId: string) {
    return this.http.post(`${this.api}/chat/mark-read/${senderId}`, {});
  }

  isOnline(userId: string): boolean {
    return this.onlineUsers().includes(userId);
  }
}
