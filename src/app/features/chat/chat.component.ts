import { Component, OnInit, OnDestroy, Output, EventEmitter, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../core/services/chat.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ChatMessage } from '../../core/models/models';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-overlay" (click)="onOverlay($event)">
      <div class="chat-window">
        <!-- Header -->
        <div class="chat-header">
          <div class="chat-admin-info">
            <div class="admin-avatar-wrap">
              <span class="admin-avatar">🍪</span>
              <span class="online-indicator" [class.online]="adminOnline()"></span>
            </div>
            <div>
              <strong>Star Crumbs</strong>
              <p class="online-text">{{adminOnline() ? 'En línea' : 'Desconectado'}}</p>
            </div>
          </div>
          <button class="close-chat" (click)="close.emit()"><i class="fas fa-times"></i></button>
        </div>

        <!-- Messages area -->
        <div class="messages-area" #msgArea>
          <div *ngIf="allMessages().length === 0" class="chat-welcome">
            <span>👋</span>
            <p>¡Hola! ¿En qué podemos ayudarte hoy?</p>
          </div>

          <div *ngFor="let msg of allMessages()"
               class="msg-row"
               [class.msg-mine]="msg.sender_id === myId"
               [class.msg-theirs]="msg.sender_id !== myId">
            <img *ngIf="msg.sender_id !== myId"
                 [src]="adminPic || 'assets/avatar.png'"
                 class="msg-avatar" alt="admin">
            <div class="msg-bubble">
              {{msg.message}}
              <span class="msg-time">{{formatTime(msg.created_at || msg.timestamp)}}</span>
            </div>
          </div>

          <div *ngIf="isTyping()" class="typing-indicator msg-row msg-theirs">
            <img [src]="adminPic || 'assets/avatar.png'" class="msg-avatar" alt="admin">
            <div class="msg-bubble typing">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>

        <!-- Input -->
        <div class="chat-input-area">
          <textarea
            [(ngModel)]="messageText"
            (keydown.enter)="onEnter($event)"
            placeholder="Escribe un mensaje..."
            class="chat-input"
            rows="1">
          </textarea>
          <button class="send-btn" (click)="sendMessage()" [disabled]="!messageText.trim()">
            <i class="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chat-overlay {
      position: fixed; inset: 0; z-index: 950;
      background: rgba(0,0,0,0.3);
    }
    .chat-window {
      position: fixed; bottom: 24px; right: 24px;
      width: 380px; height: 560px;
      background: #fff; border-radius: var(--radius-xl);
      box-shadow: var(--shadow-lg); display: flex;
      flex-direction: column; animation: slideUp 0.35s ease;
      overflow: hidden;
    }
    .chat-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 20px;
      background: linear-gradient(135deg, var(--warm-capuchino), var(--caramel-roast));
      color: #fff;
    }
    .chat-admin-info { display: flex; align-items: center; gap: 12px; }
    .admin-avatar-wrap { position: relative; }
    .admin-avatar {
      width: 44px; height: 44px; border-radius: 50%;
      background: rgba(255,255,255,0.2); display: flex;
      align-items: center; justify-content: center; font-size: 1.4rem;
    }
    .online-indicator {
      position: absolute; bottom: 2px; right: 2px;
      width: 12px; height: 12px; border-radius: 50%;
      background: #ccc; border: 2px solid #fff;
    }
    .online-indicator.online { background: var(--success); }
    .chat-header strong { font-size: 1rem; display: block; }
    .online-text { font-size: 0.75rem; opacity: 0.85; margin: 0; }
    .close-chat { background: rgba(255,255,255,0.2); border: none; cursor: pointer; color: #fff; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: background var(--transition); }
    .close-chat:hover { background: rgba(255,255,255,0.35); }

    .messages-area {
      flex: 1; overflow-y: auto; padding: 16px;
      display: flex; flex-direction: column; gap: 10px;
      background: #f8f4f0;
    }
    .chat-welcome {
      text-align: center; padding: 40px 20px;
      display: flex; flex-direction: column; align-items: center; gap: 8px;
    }
    .chat-welcome span { font-size: 2.5rem; }
    .chat-welcome p { color: var(--text-light); font-size: 0.9rem; }

    .msg-row {
      display: flex; align-items: flex-end; gap: 8px; max-width: 85%;
    }
    .msg-mine { align-self: flex-end; flex-direction: row-reverse; }
    .msg-theirs { align-self: flex-start; }
    .msg-avatar { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
    .msg-bubble {
      padding: 10px 14px; border-radius: 18px;
      font-size: 0.88rem; line-height: 1.5; position: relative;
      max-width: 100%; word-break: break-word;
    }
    .msg-mine .msg-bubble {
      background: linear-gradient(135deg, var(--warm-capuchino), var(--caramel-roast));
      color: #fff; border-bottom-right-radius: 4px;
    }
    .msg-theirs .msg-bubble {
      background: #fff; color: var(--text-dark);
      border-bottom-left-radius: 4px; box-shadow: var(--shadow-sm);
    }
    .msg-time {
      display: block; font-size: 0.65rem; opacity: 0.6; text-align: right; margin-top: 4px;
    }

    /* Typing indicator */
    .typing { display: flex; gap: 5px; align-items: center; padding: 12px 16px; }
    .typing span {
      width: 7px; height: 7px; border-radius: 50%;
      background: var(--warm-capuchino); animation: bounce 1.2s infinite;
    }
    .typing span:nth-child(2) { animation-delay: 0.2s; }
    .typing span:nth-child(3) { animation-delay: 0.4s; }

    .chat-input-area {
      display: flex; gap: 10px; padding: 14px 16px;
      border-top: 1px solid var(--almond); background: #fff;
    }
    .chat-input {
      flex: 1; border: 2px solid var(--almond); border-radius: 20px;
      padding: 10px 16px; font-family: var(--font-body); font-size: 0.9rem;
      outline: none; resize: none; max-height: 80px;
      transition: border-color var(--transition);
    }
    .chat-input:focus { border-color: var(--warm-capuchino); }
    .send-btn {
      width: 44px; height: 44px; border-radius: 50%;
      background: linear-gradient(135deg, var(--warm-capuchino), var(--caramel-roast));
      border: none; cursor: pointer; color: #fff; font-size: 1rem;
      display: flex; align-items: center; justify-content: center;
      transition: all var(--transition); flex-shrink: 0;
    }
    .send-btn:hover:not(:disabled) { transform: scale(1.1); }
    .send-btn:disabled { opacity: 0.4; cursor: default; }

    @media (max-width: 440px) {
      .chat-window { width: calc(100vw - 32px); right: 16px; bottom: 16px; height: 480px; }
    }
  `]
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @Output() close = new EventEmitter<void>();
  @ViewChild('msgArea') msgArea!: ElementRef;

  messageText = '';
  allMessages = signal<ChatMessage[]>([]);
  isTyping = signal(false);
  adminOnline = signal(false);
  adminId = '';
  adminPic = '';

  get myId() { return this.auth.currentUser()?.id || ''; }

  constructor(
    public auth: AuthService,
    private chatService: ChatService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.chatService.getAdminId().subscribe({
      next: (admin: any) => {
        this.adminId = admin.id;
        this.adminPic = admin.profile_picture || '';
        this.adminOnline.set(this.chatService.isOnline(admin.id));
        this.loadHistory();
      }
    });

    // Listen for new messages
    const origMessages = this.chatService.messages;
    setInterval(() => {
      const msgs = this.chatService.messages();
      if (msgs.length > 0) {
        const lastMsg = msgs[msgs.length - 1];
        const currentLast = this.allMessages();
        if (!currentLast.some(m => m.created_at === lastMsg.created_at && m.message === lastMsg.message)) {
          this.allMessages.update(m => [...m, lastMsg]);
        }
      }
    }, 500);
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  ngOnDestroy() {}

  loadHistory() {
    this.chatService.loadHistory(this.adminId).subscribe({
      next: msgs => {
        this.allMessages.set(msgs);
        this.scrollToBottom();
      }
    });
  }

  onEnter(e: KeyboardEvent) {
    if (!e.shiftKey) { e.preventDefault(); this.sendMessage(); }
  }

  sendMessage() {
    const text = this.messageText.trim();
    if (!text || !this.adminId) return;

    const msg: ChatMessage = {
      sender_id: this.myId,
      message: text,
      created_at: new Date().toISOString()
    };
    this.allMessages.update(m => [...m, msg]);
    this.messageText = '';

    this.chatService.sendMessage({
      receiverId: this.adminId,
      message: text,
      senderId: this.myId,
      senderName: this.auth.currentUser()?.username || '',
      senderPic: this.auth.currentUser()?.profile_picture || ''
    });
  }

  onOverlay(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('chat-overlay')) this.close.emit();
  }

  scrollToBottom() {
    try {
      const el = this.msgArea?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch {}
  }

  formatTime(val: any): string {
    if (!val) return '';
    return new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
