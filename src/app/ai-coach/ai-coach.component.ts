import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import { AiCoachService } from 'src/app/services/ai-coach.service';

interface CoachMessage {
  from: 'coach' | 'user';
  text: string;
  ts: Date;
  expanded?: boolean;
}

// Declare webkitSpeechRecognition for TypeScript access
declare var webkitSpeechRecognition: any;
declare var SpeechRecognition: any;

@Component({
  selector: 'app-ai-coach',
  templateUrl: './ai-coach.component.html',
  styleUrls: ['./ai-coach.component.css'],
})
export class AiCoachComponent implements OnInit, OnDestroy {
  @ViewChild('chatWindow') chatWindow!: ElementRef<HTMLDivElement>;

  messages: CoachMessage[] = [];
  inputText = '';

  quickPrompts: string[] = [
    'How am I doing this week?',
    'Which habit should I focus on next?',
    'Give me one simple improvement tip.',
  ];

  sending = false;
  isListening = false;
  recognition: any = null;

  // how many characters to show before "Show more…"
  previewLimit = 220;

  constructor(private aiCoach: AiCoachService) {}

  ngOnInit(): void {
    this.pushCoachIntro();
    this.initSpeechRecognition();
  }

  ngOnDestroy(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  private pushCoachIntro(): void {
    if (this.messages.length > 0) return;

    const intro =
      'Hey, I’m your HabitFlow coach. Ask me anything about your habits and I’ll turn it into tiny, doable steps.';

    this.messages.push({
      from: 'coach',
      text: intro,
      ts: new Date(),
      expanded: false,
    });
  }

  onEnter(event: Event): void {
    const e = event as KeyboardEvent;
    if (!e.shiftKey) {
      e.preventDefault();
      this.sendPrompt();
    }
  }

  sendPrompt(): void {
    const trimmed = this.inputText.trim();
    if (!trimmed || this.sending) return;

    // 1. Add user message
    this.messages.push({
      from: 'user',
      text: trimmed,
      ts: new Date(),
      expanded: false,
    });
    this.scrollToBottom();

    const ask = trimmed;
    this.inputText = '';
    this.sending = true;

    // 2. Handle simple greetings locally (do NOT call Gemini)
    if (this.handleSmallTalk(ask)) {
      this.sending = false;
      this.scrollToBottom();
      return;
    }

    // 3. Call the AI coach service for real habit questions
    this.aiCoach.askCoach(ask).subscribe({
      next: (res: any) => {
        this.sending = false;
        const reply =
          (res?.success && res?.reply) ||
          res?.message ||
          'Coach is temporarily unavailable.';

        this.messages.push({
          from: 'coach',
          text: reply,
          ts: new Date(),
          expanded: false,
        });
        this.scrollToBottom();
      },
      error: (err) => {
        console.error('COACH ERROR', err);
        this.sending = false;

        const msg =
          err?.error?.message ||
          'Coach is currently unavailable due to an error.';

        this.messages.push({
          from: 'coach',
          text: msg,
          ts: new Date(),
          expanded: false,
        });
        this.scrollToBottom();
      },
    });
  }

  /**
   * If user just says "hi/hello/hey" etc, respond with a short greeting
   * instead of sending the message to Gemini.
   */
  private handleSmallTalk(text: string): boolean {
    const cleaned = text.toLowerCase().trim();

    const greetingPatterns = [
      /^hi[.!?]*$/i,
      /^hello[.!?]*$/i,
      /^hey[.!?]*$/i,
      /^hi there[.!?]*$/i,
      /^hello there[.!?]*$/i,
      /^hey coach[.!?]*$/i,
    ];

    const isGreeting = greetingPatterns.some((re) => re.test(cleaned));

    if (!isGreeting) return false;

    const shortReply =
      "Hey! I’m glad you’re here. 👋 How can I help with your habits today?";

    this.messages.push({
      from: 'coach',
      text: shortReply,
      ts: new Date(),
      expanded: false,
    });

    return true;
  }

  useQuickPrompt(prompt: string): void {
    this.inputText = prompt;
    this.sendPrompt();
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (!this.chatWindow) return;
      const el = this.chatWindow.nativeElement;
      el.scrollTop = el.scrollHeight;
    }, 50);
  }

  // preview text for long messages
  getPreview(text: string): string {
    if (!text) return '';
    if (text.length <= this.previewLimit) return text;
    return text.substring(0, this.previewLimit) + '…';
  }

  toggleExpand(msg: CoachMessage): void {
    msg.expanded = !msg.expanded;
    this.scrollToBottom();
  }

  // Speech recognition setup
  private initSpeechRecognition(): void {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SR) {
      console.warn('Speech Recognition not supported in this browser.');
      return;
    }

    this.recognition = new SR();
    this.recognition.lang = 'en-US';
    this.recognition.interimResults = false;

    this.recognition.onstart = () => (this.isListening = true);
    this.recognition.onend = () => (this.isListening = false);
    this.recognition.onerror = (event: any) => {
      console.error('Speech Recognition Error:', event.error);
      this.isListening = false;
    };

    this.recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      this.inputText = this.inputText ? this.inputText + ' ' + text : text;
      this.recognition.stop();
    };
  }

  toggleListening(): void {
    if (!this.recognition) {
      alert('Voice input not supported in your browser.');
      return;
    }

    this.isListening ? this.recognition.stop() : this.recognition.start();
  }
}
