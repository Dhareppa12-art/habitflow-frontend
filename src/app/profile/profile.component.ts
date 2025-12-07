// src/app/profile/profile.component.ts
import { Component, OnInit } from '@angular/core';
import {
  ProfileApiService,
  BackendProfile,
} from '../services/profile-api.service';
import { AuthService } from '../core/auth.service';

type ProfileSection = 'profile' | 'security' | 'notifications' | 'settings';

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

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit {
  user: UserProfile = {
    name: '',
    email: '',
    location: '',
    phone: '',
  };

  joinedAt: string | null = null;

  security: SecurityState = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };

  notify: NotificationSettings = {
    emailReminders: true,
    dailyReminder: true,
    weeklySummary: false,
  };

  settings: AppSettings = {
    timezone: 'Asia/Kolkata',
    weekStart: 'monday',
    theme: 'system',
  };

  activeSection: ProfileSection = 'profile';

  loadingProfile = true;
  saving = false;

  errorMsg = '';
  successMsg = '';

  avatarUrl: string | null = localStorage.getItem('hf_avatar');

  constructor(
    private profileApi: ProfileApiService,
    private auth: AuthService
  ) {}

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

  // ------------------ LOAD PROFILE ------------------
  private loadProfileFromBackend(): void {
    this.loadingProfile = true;
    this.errorMsg = '';
    this.successMsg = '';

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
          timezone: u.timezone || 'Asia/Kolkata',
          weekStart: (u.weekStart as 'sunday' | 'monday') || 'monday',
          theme: (u.themePreference as 'light' | 'dark' | 'system') || 'system',
        };

        if (u.avatar) {
          this.avatarUrl = u.avatar;
          localStorage.setItem('hf_avatar', u.avatar);
        }

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

  // ------------------ AVATAR ------------------
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

      this.profileApi.updateProfile({ avatar: this.avatarUrl || '' }).subscribe();
    };
    reader.readAsDataURL(file);
  }

  clearAvatar(): void {
    this.avatarUrl = null;
    localStorage.removeItem('hf_avatar');

    this.profileApi.updateProfile({ avatar: '' }).subscribe();
  }

  // ------------------ SECTION SWITCH ------------------
  setSection(section: ProfileSection): void {
    this.activeSection = section;
    this.errorMsg = '';
    this.successMsg = '';
  }

  // ------------------ THEME ------------------
  onThemeChange(): void {
    this.applyThemeFromSettings();
    this.profileApi.updateProfile({ themePreference: this.settings.theme }).subscribe();
  }

  private applyThemeFromSettings(): void {
    const pref = this.settings.theme;

    let effective: 'light' | 'dark';
    if (pref === 'system') {
      effective = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    } else {
      effective = pref;
    }

    document.body.classList.remove('hf-theme-light', 'hf-theme-dark');
    document.body.classList.add(
      effective === 'dark' ? 'hf-theme-dark' : 'hf-theme-light'
    );

    localStorage.setItem('hf_theme_preference', pref);
  }

  // ------------------ SAVE ROUTER ------------------
  onSave(): void {
    this.errorMsg = '';
    this.successMsg = '';

    if (this.activeSection === 'profile') this.saveProfile();
    if (this.activeSection === 'security') this.updatePassword();
    if (this.activeSection === 'notifications') this.saveNotifications();
    if (this.activeSection === 'settings') this.saveSettings();
  }

  // ------------------ PROFILE SAVE ------------------
  private saveProfile(): void {
    const name = this.user.name.trim();

    if (!name) {
      this.errorMsg = 'Name is required.';
      return;
    }

    this.saving = true;

    this.profileApi
      .updateProfile({
        name,
        location: this.user.location?.trim() || '',
        phone: this.user.phone?.trim() || '',
      })
      .subscribe({
        next: () => {
          this.successMsg = 'Profile updated successfully.';
          this.saving = false;
        },
        error: (err) => {
          this.errorMsg =
            err?.error?.message || 'Failed to update profile.';
          this.saving = false;
        },
      });
  }

  // ------------------ SECURITY / PASSWORD ------------------
  private updatePassword(): void {
    const current = this.security.currentPassword.trim();
    const next = this.security.newPassword.trim();
    const confirm = this.security.confirmPassword.trim();

    // If all blank → do nothing
    if (!current && !next && !confirm) {
      return;
    }

    if (!current || !next || !confirm) {
      this.errorMsg = 'Please fill in all password fields.';
      return;
    }

    if (next.length < 6) {
      this.errorMsg = 'New password must be at least 6 characters.';
      return;
    }

    if (next !== confirm) {
      this.errorMsg = 'New password and confirmation do not match.';
      return;
    }

    this.saving = true;

    this.auth
      .changePassword({ currentPassword: current, newPassword: next })
      .subscribe({
        next: () => {
          this.successMsg = 'Password updated successfully.';
          this.saving = false;

          this.security = {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          };
        },
        error: (err) => {
          this.errorMsg =
            err?.error?.message || 'Failed to update password.';
          this.saving = false;
        },
      });
  }

  // ------------------ NOTIFICATIONS ------------------
  private saveNotifications(): void {
    this.saving = true;

    this.profileApi
      .updateProfile({
        emailReminders: this.notify.emailReminders,
        dailyReminder: this.notify.dailyReminder,
        weeklySummary: this.notify.weeklySummary,
      })
      .subscribe({
        next: () => {
          this.successMsg = 'Notification settings saved.';
          this.saving = false;
        },
        error: (err) => {
          this.errorMsg =
            err?.error?.message || 'Failed to update notification settings.';
          this.saving = false;
        },
      });
  }

  // ------------------ APP SETTINGS ------------------
  private saveSettings(): void {
    this.saving = true;

    this.profileApi
      .updateProfile({
        timezone: this.settings.timezone,
        weekStart: this.settings.weekStart,
        themePreference: this.settings.theme,
      })
      .subscribe({
        next: () => {
          this.successMsg = 'App settings saved.';
          this.saving = false;
        },
        error: (err) => {
          this.errorMsg =
            err?.error?.message || 'Failed to update app settings.';
          this.saving = false;
        },
      });
  }
}
