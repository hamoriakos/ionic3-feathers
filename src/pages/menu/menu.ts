import { Component, ViewChild } from '@angular/core';
import { IonicPage, Nav, NavController, /* NavParams, */ Tabs, Tab } from 'ionic-angular';

import { FeathersProvider } from "../../providers/feathers/feathers";

export interface IMenuItem {
  title: string;
  type: 'nav' | 'action';
  icon: string;
  action?: (that) => void;
  page?: string;
  tabPage?: any;
  tabIndex?: number; // Equal to the order of our tabs inside tabs.ts
}

@IonicPage()
@Component({
  selector: 'page-menu',
  templateUrl: 'menu.html'
})
export class MenuPage {

  protected menuItems: IMenuItem[] = [
    { title: 'Todos'       , type: 'nav'   , icon: 'home'    , page: 'TodosListPage' },
    // Example of tabbed page: { title: 'Home', type: 'nav', icon: 'home', page: 'TabsPage', tabPage: 'Tab1Page', tabIndex: 0 },
    //{ title: 'Tab 2'      , type: 'nav'   , icon: 'contacts', page: 'TabsPage', tabPage: 'Tab2Page', tabIndex: 1 },
    //{ title: 'Settings'   , type: 'nav'   , icon: 'settings', page: 'SettingsPage' },
    { title: 'Logout'     , type: 'action', icon: 'log-out' , action(that) { that.logout(); } },
  ];

  // Reference to the app's root nav
  @ViewChild(Nav) nav: Nav;

  // Basic root for our content view
  public rootPage: any = 'TodosListPage';

  constructor(
    private feathersProvider: FeathersProvider,
    private navCtrl: NavController,
    //navParams: NavParams
  ) {
  }

  ionViewDidLoad() {
    //console.log('ionViewDidLoad MenuPage');
  }

  public onClick(menuItem: IMenuItem) {

    if (menuItem.type === 'action') {
      return menuItem.action(this);
    }

    // The active child nav is our Tabs Navigation
    const childNavs: any[] = this.nav.getActiveChildNavs();
    const childTabNav: Tabs = childNavs.find(({viewCtrl}) => (viewCtrl && viewCtrl.id === menuItem.page));

    if (childTabNav && (typeof menuItem.tabIndex !== 'undefined')) {
      childTabNav.select(menuItem.tabIndex);
    } else {
      let params = {};

      if (typeof menuItem.tabIndex !== 'undefined') {
        params = { tabIndex: menuItem.tabIndex };
      }

      // Reset the content nav to have just this page
      // (we wouldn't want the back button to show in this scenario).
      this.nav.setRoot(menuItem.page, params);
    }
  }

  public isActive(page, tabPage) {
    const childTabsNav: any[] = this.nav.getActiveChildNavs();
    const selectedTab: Tab = childTabsNav.length && childTabsNav[0].getSelected && childTabsNav[0].getSelected();
    if (childTabsNav.length && typeof tabPage !== 'undefined') {
      if (selectedTab && selectedTab.root && selectedTab.root === tabPage) {
        return 'primary';
      }
      return;
    }

    // Fallback needed when there is no active childnav (tabs not active)
    const activeNav = this.nav.getActive();
    if (activeNav && activeNav.name && activeNav.name === page) {
      return 'primary';
    }

    return;
  }

  public logout() {
    this.feathersProvider.logout(this.navCtrl)
      .then(() => {
        this.nav.setRoot('LoginPage'); // return to '/' (TODO: how to return to page defined in app.component.ts?)
      })
      .catch(() => {
        this.nav.setRoot('LoginPage'); // return to '/' (TODO: how to return to page defined in app.component.ts?)
      })
    ;
  }
}
