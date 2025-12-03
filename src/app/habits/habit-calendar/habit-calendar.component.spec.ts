import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HabitCalendarComponent } from './habit-calendar.component';

describe('HabitCalendarComponent', () => {
  let component: HabitCalendarComponent;
  let fixture: ComponentFixture<HabitCalendarComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HabitCalendarComponent]
    });
    fixture = TestBed.createComponent(HabitCalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
