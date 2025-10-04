import { Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _username = signal('');
  private _password = signal('');
  private _isLoggedIn = signal(false);

  get username() {
    return this._username();
  }

  get password() {
    return this._password();
  }

  isLoggedIn = this._isLoggedIn;

  constructor() {}

  async attemptLogin(username: string, password: string): Promise<boolean> {
    if (!username || !password) {
      console.error('Login failed');
      return false;
    }

    const url = `http://${username}:${password}@${environment.couch.host}:${environment.couch.port}/${environment.couch.judgesDB}`;

    try {
      const testDB = new PouchDB(url);
      await testDB.info(); // Try connecting
      this._username.set(username);
      this._password.set(password);
      this._isLoggedIn.set(true);
       await testDB.close();
      return true;
    } catch (err) {
      console.error('Login failed:', err);
      return false;
    }
  }

  logout(): void {
    this._username.set('');
    this._password.set('');
    this._isLoggedIn.set(false);
  }
}
