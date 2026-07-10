export interface ProfileForm {
  first_name: string;
  last_name: string;
}

export type AuthMode = 'password' | 'telegram-username' | 'telegram-code' | 'set-password';
