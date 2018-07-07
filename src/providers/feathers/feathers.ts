import { Injectable } from '@angular/core';

//?import * as feathersRx from 'feathers-reactive';
import io from "socket.io-client";

//import feathers from "@feathersjs/rest-client";
//import feathers from "@feathersjs/primus-client";
//import socketio from "@feathersjs/socketio-client";
//?import feathersAuthClient from '@feathersjs/authentication-client';
import feathers from "@feathersjs/client";

@Injectable()
export class FeathersProvider {

  apiUrl = 'http://localhost:3030';
//  apiUrl = 'https://jsonplaceholder.example.com';

  private _feathers = feathers();
  private _socket;

  private reauth; // Stored login credentials for reauth if session fails.
  private errorHandler = (error) => {
    if (this.reauth) {
      console.log('Feathers reauthentication-error, re-authenticating...');
      this.authenticate(this.reauth);
    } else {
      console.log('DEBUG: Feathers reauthentication-error, but no credentials saved.');
    }
  };

  constructor() {
    // Add socket.io plugin
    this._socket = io(this.apiUrl, {
//      transports: ['websocket'],
//      forceNew: true
    });
    //this._feathers.configure(feathersSocketIOClient(this._socket));
    this._feathers.configure(feathers.socketio(this._socket));

    // Add authentication plugin
    //?this._feathers.configure(feathersAuthClient({
    this._feathers.configure(feathers.authentication({
      storage: window.localStorage
    }));

    // Add feathers-reactive plugin
    //?this._feathers.configure(feathersRx({ idField: '_id' }));

  }

  // Registered callbacks for page entry auth guard and not logged in guard
  private guardCallback: ((nav:any) => void)[];
  public setGuardCallback(cbMustLogin: (nav:any) => void, cbHasUser: (nav:any) => void) {
    this.guardCallback = [cbMustLogin, cbHasUser];
  }

  // Expose services
  public service(name: string) {
    return this._feathers.service(name);
  }

  // Expose authentication
  public authenticate(credentials?): Promise<any> {
    this.reauth = null; // Remove stored credentials
    if (credentials && credentials.email) {
      credentials.strategy = credentials.strategy || 'local';
    }
    let reauth;
    return this._feathers.authenticate(credentials)
      .then(response => {
        console.log('Authenticated: ', response);
        //TODO: can we use response.accessToken across server restarts? I assume it should, as its the purpose of JWT. How can we test that/verify?
        //TODO: What about accessToken limited lifetime? Does feathers client keep the tabs on storing login and renewing accessToken?? How can we test/verify that?
        //TODO: if we can't use this.reauth = response; then save user credentials with email/password. Implement encrypted persistent store.
        reauth = response; // save until JWT is verified.
        return this._feathers.passport.verifyJWT(response.accessToken);
      })
      .then(payload => {
        console.log('JWT Payload: ', payload);
        if (reauth) {
          this.reauth = reauth;
          this._feathers.on('reauthentication-error', this.errorHandler);
        }
        return this._feathers.service('users').get(payload.userId);
      })
      .then(user => {
        this._feathers.set('user', user);
        console.log('User: ', this._feathers.get('user'));
      })
    ;
  }

  // Expose registration
  public register(credentials): Promise<any> {
    if (!credentials || !credentials.email || !credentials.password) {
      return Promise.reject(new Error('No credentials'));
    }
    this.reauth = null;
    return this._feathers.service('users').create(credentials)
      .then(() => this.authenticate(credentials))
    ;
  }

  public hasValidIdToken(): Promise<any> {
    console.log('hasValidIdToken(): checking saved auth token...');
    return this.authenticate()
      .then(() => {
        console.log('hasValidIdToken(): has valid saved auth token.');
        return true;
      })
      .catch((err) => {
        console.log('hasValidIdToken(): no valid saved auth token.');
        return Promise.reject(err);
      })
    ;
    // Use as:
    // feathersProvider.hasValidIdToken().then(() => {
    //   // show application page
    //   ...
    // }).catch(() => {
    //   // show login page
    //   ...
    // })
  }

  // Guard method for views that must be logged in (e.g. user and data)
  public enforceValidIdToken(page: string, nav: any): Promise<any> {
    console.log('enforceValidIdToken(%s): checking saved auth token...', page);
    return this.authenticate()
      .then(() => {
        // Ok
        console.log('enforceValidIdToken(%s): has valid saved auth token, ok.', page);
        return true;
      })
      .catch((err) => {
        // Force auth guard
        console.log('enforceValidIdToken(%s): no valid saved auth token, calling guard.', page);
        if (this.guardCallback && this.guardCallback[0]) {
          try { this.guardCallback[0](nav); } catch(ignore) {}
        }
        return Promise.reject(err);
      })
    ;
  }

  // Guard method for views that must be logged out (e.g. login/register)
  public enforceInvalidIdToken(page: string, nav: any): Promise<any> {
    console.log('enforceInvalidIdToken(%s): checking saved auth token...', page);
    let guard = false; // Track if guard was triggered for last .catch
    return this.authenticate()
      .then(() => {
        // Force login guard
        console.log('enforceInvalidIdToken(%s): has valid saved auth token, calling guard.', page);
        guard = true;
        if (this.guardCallback && this.guardCallback[1]) {
          try { this.guardCallback[1](nav); } catch(ignore) {}
        }
        return Promise.reject(new Error('already logged in'));
      })
      .catch((err) => {
        if (guard) {
          return err;
        }
        // Ok
        console.log('enforceInvalidIdToken(%s): no valid saved auth token, ok.', page);
        return true;
      })
    ;
  }


  public getUserInfo() {
    return this._feathers.get('user');
  }

  // Expose logout
  public logout(nav: any): Promise<any> {
    this.reauth = null;
    return this._feathers.logout()
      .then((result) => {
        if (this.guardCallback && this.guardCallback[1]) {
          try { this.guardCallback[1](nav); } catch(ignore) {}
        }
        return result;
      })
      .catch((error) => {
        console.log(error);
        if (this.guardCallback && this.guardCallback[1]) {
          try { this.guardCallback[1](nav); } catch(ignore) {}
        }
        //return error; // Nobody cares about logout error.
      })
    ;
  }
}
