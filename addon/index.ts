export interface PusherSubscriber {
  PUSHER_SUBSCRIPTIONS: {[k: string]: string|string[]},
  send(evt: string, handler: Function): void;
  willDestroy(callback: Function): void;
}
