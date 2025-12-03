// src/app/profile/profile.component.ts
import { Component, OnInit } from '@angular/core';
import {
  ProfileApiService,
  BackendProfile,
} from '../services/profile-api.service';
import { AuthService } from '../core/auth.service';

interface UserProfile {
  name: string;
  email: string;
  location: string;
  phone: string;
}

interface SecurityState {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface NotificationSettings {
  emailReminders: boolean;
  dailyReminder: boolean;
  weeklySummary: boolean;
}

interface AppSettings {
  timezone: string;
  weekStart: 'sunday' | 'monday';
  theme: 'light' | 'dark' | 'system';
}

type ProfileSection = 'profile' | 'security' | 'notifications' | 'settings';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit {
  // ---- User profile loaded from backend ----
  user: UserProfile = {
    name: '',
    email: '',
    location: '',
    phone: '',
  };

  joinedAt: string | null = null;

  // ---- Security tab ----
  security: SecurityState = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };

  // ---- Notifications tab ----
  notify: NotificationSettings = {
    emailReminders: true,
    dailyReminder: true,
    weeklySummary: false,
  };

  // ---- App settings tab ----
  settings: AppSettings = {
    timezone: 'Asia/Kolkata',
    weekStart: 'monday',
    theme: 'system',
  };

  activeSection: ProfileSection = 'profile';

  // loading flags
  loadingProfile = true;
  saving = false;
  errorMsg = '';

  // avatar image (prefer backend; fallback localStorage)
  avatarUrl: string | null = localStorage.getItem('hf_avatar');

  constructor(
    private profileApi: ProfileApiService,
    private auth: AuthService
  ) {}

  // --------- GETTERS ----------
  get usernameFirstLetter(): string {
    return this.user.name?.charAt(0).toUpperCase() || 'U';
  }

  get saveLabel(): string {
    switch (this.activeSection) {
      case 'security':
        return 'Update password';
      case 'notifications':
        return 'Save notification settings';
      case 'settings':
        return 'Save app settings';
      default:
        return 'Save profile';
    }
  }

  // --------- INIT ----------
  ngOnInit(): void {
    const storedTheme = localStorage.getItem(
      'hf_theme_preference'
    ) as 'light' | 'dark' | 'system' | null;

    if (storedTheme) {
      this.settings.theme = storedTheme;
    }

    this.applyThemeFromSettings();
    this.loadProfileFromBackend();
  }

  // --------- LOAD PROFILE FROM BACKEND ----------
  private loadProfileFromBackend(): void {
    this.loadingProfile = true;
    this.errorMsg = '';

    this.profileApi.getProfile().subscribe({
      next: (res) => {
        const u: BackendProfile = res.data;

        this.user = {
          name: u.name || '',
          email: u.email || '',
          location: u.location || '',
          phone: u.phone || '',
        };

        this.joinedAt = u.createdAt || null;

        this.notify = {
          emailReminders: u.emailReminders ?? true,
          dailyReminder: u.dailyReminder ?? true,
          weeklySummary: u.weeklySummary ?? false,
        };

        this.settings = {
          timezone: (u.timezone as string) || 'Asia/Kolkata',
          weekStart: (u.weekStart as 'sunday' | 'monday') || 'monday',
          theme: (u.themePreference as 'light' | 'dark' | 'system') || 'system',
        };

        if (u.avatar) {
          this.avatarUrl = u.avatar;
          localStorage.setItem('hf_avatar', u.avatar);
        }

        this.applyThemeFromSettings();
        this.loadingProfile = false;
      },
      error: (err) => {
        console.error('PROFILE LOAD ERROR', err);
        this.errorMsg =
          err?.error?.message || 'Failed to load profile information.';
        this.loadingProfile = false;
      },
    });
  }

  // --------- AVATAR ----------
  openAvatarPicker(input: HTMLInputElement): void {
    input.click();
  }

  onAvatarSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.avatarUrl = reader.result as string;
      localStorage.setItem('hf_avatar', this.avatarUrl || '');

      // Save avatar to backend immediately
      this.profileApi.updateProfile({ avatar: this.avatarUrl || '' }).subscribe({
        next: () => {},
        error: (err) => {
          console.error('AVATAR UPDATE ERROR', err);
        },
      });
    };
    reader.readAsDataURL(file);
  }

  clearAvatar(): void {
    this.avatarUrl = null;
    localStorage.removeItem('hf_avatar');

    this.profileApi.updateProfile({ avatar: '' }).subscribe({
      next: () => {},
      error: (err) => {
        console.error('AVATAR CLEAR ERROR', err);
      },
    });
  }

  // --------- SECTIONS ----------
  setSection(section: ProfileSection): void {
    this.activeSection = section;
  }

  // --------- THEME ----------
  onThemeChange(): void {
    this.applyThemeFromSettings();
    this.profileApi
      .updateProfile({ themePreference: this.settings.theme })
      .subscribe({
        next: () => {},
        error: (err) => {
          console.error('THEME UPDATE ERROR', err);
        },
      });
  }

  private applyThemeFromSettings(): void {
    const pref = this.settings.theme;
    let effective: 'light' | 'dark';

    if (pref === 'system') {
      const mq = window.matchMedia
        ? window.matchMedia('(prefers-color-scheme: dark)')
        : null;
      effective = mq && mq.matches ? 'dark' : 'light';
    } else {
      effective = pref;
    }

    document.body.classList.remove('hf-theme-light', 'hf-theme-dark');
    document.body.classList.add(
      effective === 'dark' ? 'hf-theme-dark' : 'hf-theme-light'
    );

    localStorage.setItem('hf_theme_preference', pref);
  }

  // --------- SAVE BUTTON ----------
  onSave(): void {
    if (this.activeSection === 'profile') {
      this.saveProfileToBackend();
    } else if (this.activeSection === 'security') {
      this.changePasswordToBackend();
    } else if (this.activeSection === 'notifications') {
      this.saveNotificationsToBackend();
    } else if (this.activeSection === 'settings') {
      this.saveSettingsToBackend();
    }
  }

  // ---- Save: Profile ----
  private saveProfileToBackend(): void {
    const name = this.user.name.trim();
    const location = this.user.location?.trim() || '';
    const phone = this.user.phone?.trim() || '';

    if (!name) {
      alert('Name is required.');
      return;
    }

    this.saving = true;
    this.errorMsg = '';

    this.profileApi
      .updateProfile({
        name,
        location,
        phone,
      })
      .subscribe({
        next: () => {
          this.saving = false;
          alert('Profile updated successfully.');

          this.auth.getMe().subscribe({
            next: () => {},
            error: () => {},
          });
        },
        error: (err) => {
          console.error('PROFILE UPDATE ERROR', err);
          this.errorMsg =
            err?.error?.message || 'Failed to update profile.';
          this.saving = false;
        },
      });
  }

  // ---- Save: Security (change password) ----
  private changePasswordToBackend(): void {
    const current = this.security.currentPassword.trim();
    const next = this.security.newPassword.trim();
    const confirm = this.security.confirmPassword.trim();

    if (!current || !next || !confirm) {
      alert('Please fill in all password fields.');
      return;
    }

    if (next.length < 6) {
      alert('New password must be at least 6 characters long.');
      return;
    }

    if (next !== confirm) {
      alert('New password and confirmation do not match.');
      return;
    }

    this.saving = true;
    this.errorMsg = '';

    this.auth
      .changePassword({ currentPassword: current, newPassword: next })
      .subscribe({
        next: (res) => {
          this.saving = false;
          alert(res?.message || 'Password updated successfully.');

          this.security = {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          };
        },
        error: (err) => {
          console.error('CHANGE PASSWORD ERROR', err);
          this.errorMsg =
            err?.error?.message || 'Failed to update password.';
          alert(this.errorMsg);
          this.saving = false;
        },
      });
  }

  // ---- Save: Notifications ----
  private saveNotificationsToBackend(): void {
    this.saving = true;
    this.errorMsg = '';

    this.profileApi
      .updateProfile({
        emailReminders: this.notify.emailReminders,
        dailyReminder: this.notify.dailyReminder,
        weeklySummary: this.notify.weeklySummary,
      })
      .subscribe({
        next: () => {
          this.saving = false;
          alert('Notification preferences saved.');
        },
        error: (err) => {
          console.error('NOTIFICATIONS UPDATE ERROR', err);
          this.errorMsg =
            err?.error?.message || 'Failed to update notification settings.';
          this.saving = false;
        },
      });
  }

  // ---- Save: Settings ----
  private saveSettingsToBackend(): void {
    this.saving = true;
    this.errorMsg = '';

    this.profileApi
      .updateProfile({
        timezone: this.settings.timezone,
        weekStart: this.settings.weekStart,
        themePreference: this.settings.theme,
      })
      .subscribe({
        next: () => {
          this.saving = false;
          alert('App settings saved.');
        },
        error: (err) => {
          console.error('SETTINGS UPDATE ERROR', err);
          this.errorMsg =
            err?.error?.message || 'Failed to update app settings.';
          this.saving = false;
        },
      });
  }
}
