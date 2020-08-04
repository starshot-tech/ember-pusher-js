ember-pusher-js
==============================================================================

An Ember Octane and TypeScript-friendly pusher.js wrapper that is **heavily** inspired by [the existing ember-pusher addon](https://github.com/jamiebikies/ember-pusher)

Compatibility
------------------------------------------------------------------------------

* Ember.js v3.4 or above
* Ember CLI v2.13 or above
* Node.js v10 or above


Installation
------------------------------------------------------------------------------

1. Add `"ember-pusher-js": "starshot-tech/ember-pusher-js"` to the `devDependencies` object in `package.json`
2. `npm install` (or `yarn`)
3. `ember g ember-pusher-js`


If your project's `ember-source` dependency is <3.6.0, the `ember-native-class-polyfill` package will be installed as an additional dependency

Usage
------------------------------------------------------------------------------

### Configuration

The addon expects a `pusher` object to be added to your `config/environment.js` ENV object.

```javascript
ENV['pusher'] = {
  key: 'xxxxxxx' // Pusher APP key (required)
  cluster: 'xx' // Pusher cluster (required)
  logToConsole: false // Should socket events be logged to console
}
```

### The Pusher service

#### `wireSubscriptions(target: EmberObject): void`

This method should be called after declaring your channels and events in the `PUSHER_SUBSCRIPTIONS` property. This can be done in a class field, or in a route hook that precedes your call to `wireSubscriptions`. If you need more fine-grained control over when / how channels are subscribed to, check out the `wire` method below.

In TypeScript projects where your channels and events are static (see below example), your Ember class can implement the `PusherSubscriber` interface to ensure this is configured properly at compile time. If you're using JS or your channels and events are dynamic, the service will verify the presence of this object at runtime.

The Pusher service assumes you have actions that correspond to each event name present. This emulates how `ember-pusher`'s mixin works. The action names are mapped using `Ember.String.camelize` on the event name.

```typescript
import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import PusherService, { PusherSubscriber } from 'ember-pusher-js/services/pusher';

export default class ChatRoute extends Route implements PusherSubscriber {
  @service pusher: PusherService;

  PUSHER_SUBSCRIPTIONS = {
    'presence': ['enter-room', 'leave-room'],
    'messages': 'new-message'
  }

  setupController(controller, model, transition): void {
    super.setupController(controller, model, transition);

    controller.set('users', A());
    controller.set('messages', A());

    // PUSHER_SUBSCRIPTIONS must be defined on the object before the
    // wireSubscriptions method is called
    this.pusher.wireSubscriptions(this);
  }

  @action
  enterRoom(evt) {
    this.controller.users.pushObject(evt.user);
  }

  @action
  leaveRoom(evt) {
    this.controller.users.removeObject(evt.user);
  }

  @action
  newMessage(evt) {
    this.controller.messages.pushObject(evt.message);
  }
}
```

---

#### `wire(target: EmberObject, channelName: string, events: string|string[]): void`

If you need to manually subscribe to a channel, you can do so with the `wire` method

```javascript
import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class ChatRoute extends Route {
  @service pusher;

  model(params) {
    return this.store.findRecord('channel', params.id);
  }

  afterModel(model) {
    this.pusher.wire(this, model.channelName, model.events);
  }
}
```

---

#### `unwireSubscriptions(target: EmberObject): void`

This method can be used to unsubscribe and unbind to all channels and events specified in an EmberObject that has `PUSHER_SUBSCRIPTIONS` defined

---

#### `unwire(target: EmberObject, channelName: string): void`

Unbinds to all events and unsubscribes from the channel passed in

---

#### `subscribe(channelName: string): Pusher.Channel`

Manually subscribe to a channel. Returns the Pusher Channel object which can be used to manually `bind` to events on the channel

---

#### `client: Pusher`

Access the Pusher.js client directly

---

#### `isConnected: boolean`

Lets you know the status of your Pusher connection

---

#### `socketId: string|undefined`

If there is a Pusher connection, returns the socket ID

---

Contributing
------------------------------------------------------------------------------

See the [Contributing](CONTRIBUTING.md) guide for details.


License
------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE.md).
