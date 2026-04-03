import { Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _username = signal('');
  private _password = signal('');
  private _isLoggedIn = signal(false);
  private readonly STORAGE_KEY = 'starsAuth';
  private readonly EXPIRATION_MS = 24 * 60 * 60 * 1000; // 1 day

  get username() {
    return this._username();
  }

  get password() {
    return this._password();
  }

  isLoggedIn = this._isLoggedIn;

  constructor() {
    this.restoreSession();
  }

  async attemptLogin(username: string, password: string): Promise<boolean> {
    if (!username || !password) {
      console.error('Login failed');
      return false;
    }

    const url = `${environment.couch.protocol}://${username}:${password}@${environment.couch.host}:${environment.couch.port}/${environment.couch.confDB}`;

    try {
      const testDB = new PouchDB(url);
      await testDB.info();
      await testDB.close();

      // Save to memory
      this._username.set(username);
      this._password.set(password);
      this._isLoggedIn.set(true);

      // Save to localStorage with timestamp
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        username,
        password,
        timestamp: Date.now()
      }));

      return true;
    } catch (err) {
      console.error('Login failed:', err);
      return false;
    }
  }

  private restoreSession(): void {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (!saved) return;

    try {
      const data = JSON.parse(saved);
      const expired = Date.now() - data.timestamp > this.EXPIRATION_MS;

      if (expired) {
        this.logout();
        return;
      }

      this._username.set(data.username);
      this._password.set(data.password);
      this._isLoggedIn.set(true);
    } catch (e) {
      console.error('Failed to restore session:', e);
      this.logout();
    }
  }

  logout(): void {
    this._username.set('');
    this._password.set('');
    this._isLoggedIn.set(false);
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
