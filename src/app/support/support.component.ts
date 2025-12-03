// src/app/support/support.component.ts
import { Component } from '@angular/core';

interface SupportMessage {
  name: string;
  email: string;
  category: string;
  message: string;
  createdAt: Date;
}

@Component({
  selector: 'app-support',
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.css'],
})
export class SupportComponent {
  // default (you can change)
  name = 'Dhareppa';
  email = 'dhareppabistagond17@gmail.com';
  category = 'Bug or issue';

  categories: string[] = [
    'Bug or issue',
    'Feature request',
    'Design / UX feedback',
    'Account / data question',
    'Other',
  ];

  message = '';
  messages: SupportMessage[] = [];

  submitting = false;
  successMsg = '';

  onSubmit(): void {
    if (!this.message.trim()) return;

    this.submitting = true;

    setTimeout(() => {
      const entry: SupportMessage = {
        name: this.name.trim() || 'Anonymous user',
        email: this.email.trim(),
        category: this.category,
        message: this.message.trim(),
        createdAt: new Date(),
      };

      // latest on top
      this.messages.unshift(entry);

      this.message = '';
      this.submitting = false;
      this.successMsg =
        'Thanks! Your message has been recorded (demo only). In a real app this would be sent to support.';

      setTimeout(() => (this.successMsg = ''), 3000);
    }, 600);
  }
}
