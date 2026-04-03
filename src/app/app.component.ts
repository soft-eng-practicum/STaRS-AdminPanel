import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';
import { PouchdbService } from './services/pouchdb.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  private pouch = inject(PouchdbService);
  syncingMessage = computed(() => this.pouch.syncingMessage());
  syncingStatus = computed(() => this.pouch.syncingStatus());
  isAuth = computed(() => this.auth.isLoggedIn());
  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    //if session restored, start sync automatically
    if (this.auth.isLoggedIn()) {
      this.pouch.initDatabases();
    }
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }


}
