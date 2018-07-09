import { Component } from '@angular/core';
import { IonicPage, NavController } from 'ionic-angular';

import { FeathersProvider } from "../../providers/feathers/feathers";

@IonicPage()
@Component({
  selector: 'page-todos-list',
  templateUrl: 'todos-list.html'
})
export class TodosListPage {

  constructor(
    public feathersProvider: FeathersProvider,
    public navCtrl: NavController
  ) {

  }

  // Entry guard
  ionViewCanEnter(): boolean | Promise<any> {
    // Must be logged in. If not - will redirect to login page internally.
    return this.feathersProvider.enforceValidIdToken('TodosListPage', this.navCtrl);
  }
}
