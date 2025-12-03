// app-shell.component.ts (add or update)
import { Component } from '@angular/core';
import { HabitService } from '../core/habit.service';

@Component({
  selector: 'app-shell',
  templateUrl: './app-shell.component.html'
})
export class AppShellComponent {
  constructor(public habitService: HabitService) {}
  onSearch(q: string) { /* optional: emit event or use service */ }
  toggleCollapse() { /* optional: toggle sidebar state and save to localStorage */ }
}
