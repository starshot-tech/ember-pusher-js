import Service from '@ember/service';
import Pusher, { Channel } from 'pusher-js';
import { PusherMock } from 'pusher-js-mock';
export interface PusherSubscriber {
    PUSHER_SUBSCRIPTIONS: {
        [k: string]: string | string[];
    };
    send?(action: string, ...args: unknown[]): void;
    actions?: {
        [k: string]: (...args: unknown[]) => void;
    };
}
export default class PusherService extends Service {
    private pusherConfig;
    private bindings;
    readonly client: Pusher | PusherMock;
    isDisconnected: boolean;
    constructor();
    get isConnected(): boolean;
    get socketId(): string | undefined;
    subscribe(channelName: string): Channel;
    wire(target: PusherSubscriber, channelName: string, events: string | string[]): void;
    private wireEvent;
    unwire(target: PusherSubscriber, channelName: string): void;
    wireSubscriptions(target: PusherSubscriber): void;
    unwireSubscriptions(target: PusherSubscriber): void;
    unsubscribeAll(): void;
    private get pusherClass();
    private setup;
    private didDisconnect;
    private didConnect;
    private setupForTest;
}
