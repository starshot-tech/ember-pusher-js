import { A } from '@ember/array';
import MutableArray from '@ember/array/mutable';
import { assert } from '@ember/debug';
import { run } from '@ember/runloop';
import Service from '@ember/service';
import { camelize } from '@ember/string';
import Ember from 'ember';
import config from 'ember-get-config';
import { PusherSubscriber } from 'ember-pusher-js';
import Pusher, { Channel } from 'pusher-js';
import { PusherMock } from 'pusher-js-mock';
import PusherWithEncryption from 'pusher-js/with-encryption';

interface PusherBindings {
  [k: string]: {
    channel: Channel,
    events: {
      [k: string]: MutableArray<{handler: Function, name: string}>
    }
  }
}

export default class PusherService extends Service {
  private pusherConfig: any;
  private bindings: PusherBindings;

  public client: Pusher|PusherMock;
  public isDisconnected: boolean = true;

  constructor() {
    super(...arguments);

    this.pusherConfig = config.pusher;
    this.bindings = {};
    this.client = this.setup();
  }

  public get isConnected(): boolean {
    return !this.isDisconnected;
  }

  public get socketId(): string|undefined {
    try {
      return this.client.connection.socket_id;
    } catch(e) {
      Ember.Logger.warn(e);
      return;
    }
  }

  public subscribe(channelName: string): Channel {
    if (!this.bindings.hasOwnProperty(channelName)) {
      const channel = this.client.subscribe(channelName);
      const events = {};

      this.bindings[channelName] = { channel, events };
    }

    return this.bindings[channelName].channel;
  }

  public wire(target: PusherSubscriber, channelName: string, events: string|string[]): void {
    const channel = this.subscribe(channelName);
    const targetId = target.toString();

    if (!Array.isArray(events)) {
      events = [events as string];
    }

    if (!this.bindings[channelName].events.hasOwnProperty(targetId)) {
      this.bindings[channelName].events[targetId] = A();
    }

    events.forEach((eventName: string) => {
      const normalizedEventName = camelize(eventName);
      const events = this.bindings[channelName].events[targetId];
      const handler = function(data: any) {
        run(() => target.send(normalizedEventName, data));
      }

      channel.bind(eventName, handler);

      const foundEvent = events.find((evt: {name: string, handler: Function}) => {
        return evt.name === eventName;
      });

      if (foundEvent) {
        foundEvent.handler = handler;
        return;
      }

      events.pushObject({ handler, name: eventName });


      target.willDestroy = (function() {
        const toAppend = target.willDestroy;
        return function() {
          channel.unbind(eventName, handler);
          events.removeObject({ handler, name: eventName });
          toAppend.apply(target, arguments);
        }
      })();
    });
  }

  public unwire(target: PusherSubscriber, channelName: string): void {
    const { channel } = this.bindings[channelName];
    const targetId = target.toString();
    const events = this.bindings[channelName].events[targetId];

    events.forEach((evt) => {
      channel.unbind(evt.name, evt.handler);
    });

    delete this.bindings[channelName].events[targetId];

    if (!Object.keys(this.bindings[channelName].events).length) {
      this.client.unsubscribe(channelName);
      delete this.bindings[channelName];
    }
  }

  public wireSubscriptions(target: PusherSubscriber): void {
    assert('PUSHER_SUBSCRIPTIONS object must exist', target.hasOwnProperty('PUSHER_SUBSCRIPTIONS'));

    const subscriptions = target.PUSHER_SUBSCRIPTIONS;
    Object.keys(subscriptions).forEach((channelName: string) => {
      const events = subscriptions[channelName];
      this.wire(target, channelName, events);
    });
  }

  public unwireSubscriptions(target: PusherSubscriber): void {
    const subscriptions = target.PUSHER_SUBSCRIPTIONS;
    Object.keys(subscriptions).forEach((channelName: string) =>
      this.unwire(target, channelName));
  }

  private get pusherClass(): any {
    return this.pusherConfig.withEncryption
      ? PusherWithEncryption
      : Pusher;
  }

  private setup(): Pusher|PusherMock {
    if (this.client) {
      return this.client;
    }

    if (config.environment === 'test') {
      return this.setupForTest();
    }

    Pusher.logToConsole = this.pusherConfig.logToConsole || false;

    const { key, cluster } = this.pusherConfig;
    const client = new this.pusherClass(key, { cluster });

    client.connection.bind('connected', this.didConnect.bind(this));
    client.connection.bind('disconnected', this.didDisconnect.bind(this));
    client.connection.bind('unavailable', this.didDisconnect.bind(this));

    return client;
  }

  private didDisconnect(): void {
    this.isDisconnected = true;
  }

  private didConnect(): void {
    this.isDisconnected = false;
  }

  private setupForTest(): PusherMock {
    return new PusherMock();
  }
}
