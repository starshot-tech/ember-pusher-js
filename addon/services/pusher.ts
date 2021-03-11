import { A } from '@ember/array';
import MutableArray from '@ember/array/mutable';
import { assert } from '@ember/debug';
import EmberObject from '@ember/object';
import { run } from '@ember/runloop';
import Service from '@ember/service';
import { camelize } from '@ember/string';
import config from 'ember-get-config';
import Pusher, { Channel } from 'pusher-js';
import { PusherMock } from 'pusher-js-mock';
import PusherWithEncryption from 'pusher-js/with-encryption';

export interface PusherSubscriber {
  PUSHER_SUBSCRIPTIONS: {
    [k: string]: string|string[];
  };
  send?(action: string, ...args: unknown[]): void;
  actions?: {[k: string]: (...args: unknown[]) => void};
  willDestroy: () => void;
}

interface PusherBindings {
  [k: string]: {
    channel: Channel,
    events: {
      [k: string]: MutableArray<{
        handler: (data: any) => void,
        name: string
      }>
    }
  }
}

export default class PusherService extends Service {
  private pusherConfig: any;
  private bindings: PusherBindings;

  public readonly client: Pusher|PusherMock;
  public isDisconnected: boolean;

  constructor() {
    super(...arguments);

    this.isDisconnected = true;
    this.pusherConfig = config.pusher || {};
    this.bindings = {};
    this.client = this.setup();
  }

  public get isConnected(): boolean {
    return !this.isDisconnected;
  }

  public get socketId(): string|undefined {
    return this.client?.connection?.socket_id;
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
      this.wireEvent(eventName, channel, target);
    });

    const _willDestroy = target.willDestroy;
    target.willDestroy = () => {
      this.unwire(target, channelName);
      _willDestroy.apply(target, arguments);
    }
  }

  private wireEvent(eventName: string, channel: Channel, target: PusherSubscriber) {
    const targetId = target.toString();

    const normalizedEventName = camelize(eventName);
    const events = this.bindings[channel.name].events[targetId];
    const handler = (data: any) => {
      run(() => target instanceof EmberObject
        ? target.send!(normalizedEventName, data)
        : target.actions![normalizedEventName].bind(target)(data)
      );
    }

    channel.bind(eventName, handler);

    const foundEvent = events.find((evt: { name: string, handler: (data: any) => void }) => {
      return evt.name === eventName;
    });

    foundEvent
      ? foundEvent.handler = handler
      : events.pushObject({ handler, name: eventName });
  }

  public unwire(target: PusherSubscriber, channelName: string): void {
    if (!this.bindings[channelName]) { return; }

    const { channel } = this.bindings[channelName];
    const targetId = target.toString();
    const events = this.bindings[channelName].events[targetId];

    if (!events) { return; }

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
    Object.keys(subscriptions).forEach((channelName: string) => {
      this.unwire(target, channelName);
    });
  }

  public unsubscribeAll(): void {
    Object.keys(this.client.channels).forEach((channel) => {
      this.client.unsubscribe(channel);
    });

    this.bindings = {};
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

    this.pusherClass.logToConsole = this.pusherConfig.logToConsole || false;

    const { key, cluster, auth, authEndpoint } = this.pusherConfig;
    const client = new this.pusherClass(key, { cluster, auth, authEndpoint });

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
