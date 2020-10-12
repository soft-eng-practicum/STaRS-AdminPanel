import { Component} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss', '../css/w3.css']
})

export class AppComponent {
  title = 'STaRS-Admin';

  constructor(private route: ActivatedRoute,
    private router: Router){

    }
}
