import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import {PouchdbService} from '../../services/pouchdb.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  username = '';
  password = '';
  loading = false;
  error = '';

  constructor(private auth: AuthService, private pouchdb: PouchdbService, private router: Router) {}

  async login(): Promise<void> {
    this.loading = true;
    this.error = '';

    const success = await this.auth.attemptLogin(this.username, this.password);
    if (success) {
      this.pouchdb.initDatabases();
      this.router.navigate(['/dashboard']);
    }

    this.loading = false;

    if (success) {
      this.router.navigate(['/dashboard']);
    } else {
      this.error = 'Invalid credentials or unable to connect.';
    }
  }
}
