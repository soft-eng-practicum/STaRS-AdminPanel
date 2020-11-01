import { Component, NgZone, OnInit } from "@angular/core";
import { PouchService } from "./pouch.service";
import { Platform } from "@ionic/angular";
import { SplashScreen } from "@ionic-native/splash-screen/ngx";
import { StatusBar } from "@ionic-native/status-bar/ngx";

@Component({
  selector: "app-root",
  templateUrl: "app.component.html",
  styleUrls: ["app.component.scss"],
})
export class AppComponent {
  public people: Array<any>;
  public form: any;
  private platform: Platform;
  private splashScreen: SplashScreen;
  private statusBar: StatusBar;
  private password: any = [];

  constructor(private database: PouchService, private zone: NgZone) {
    
    this.people = [];
    this.form = {
      username: "",
      firstname: "",
      lastname: "",
    };
  }

  public ngOnInit() {
    // this.database.sync("http://admin:starsGGCadmin@itec-gunay.duckdns.org:5984/");
    // this.database.getChangeListener().subscribe((data) => {
    //   for (let i = 0; i < data.change.docs.length; i++) {
    //     this.zone.run(() => {
    //       this.people.push(data.change.docs[i]);
    //     });
    //   }
    // });
    // this.database.fetch().then(
    //   (result) => {
    //     this.people = [];
    //     for (let i = 0; i < result.rows.length; i++) {
    //       this.people.push(result.rows[i].doc);
    //     }
    //   },
    //   (error) => {
    //     console.error(error);
    //   }
    // );

    this.initializeApp();
  }

  initializeApp() {
  //   this.platform.ready().then(() => {
  //     this.statusBar.styleDefault();
  //     this.splashScreen.hide();
  //   });
  // }
  }
}
