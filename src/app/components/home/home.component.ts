import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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

  constructor(private auth: AuthService, private router: Router) {}

  async login(): Promise<void> {
    this.loading = true;
    this.error = '';

    const success = await this.auth.attemptLogin(this.username, this.password);

    this.loading = false;

    if (success) {
      this.router.navigate(['/dashboard']);
    } else {
      this.error = 'Invalid credentials or unable to connect.';
    }
  }
}
