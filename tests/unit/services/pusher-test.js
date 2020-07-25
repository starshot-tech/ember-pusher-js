import Component from '@ember/component';
import Controller from '@ember/controller';
import Route from '@ember/routing/route';
import GComponent from '@glimmer/component';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { PusherChannelMock } from 'pusher-js-mock';

module('Unit | Service | pusher', function(hooks) {
  setupTest(hooks);

  // Replace this with your real tests.
  test('it exists', function(assert) {
    let service = this.owner.lookup('service:pusher');
    assert.ok(service);
  });

  test('#subscribe', function(assert) {
    let service = this.owner.lookup('service:pusher');

    const channel = service.subscribe('channel-1');
    assert.equal(channel instanceof PusherChannelMock, true);
    assert.equal(channel.name, 'channel-1');
  });

  const targets = [
    {
      type: 'controller',
      target() {
        return TestController.create();
      },
    },
    {
      type: 'route',
      target() {
        return TestRoute.create();
      }
    },
    {
      type: 'glimmer component',
      target(owner) {
        return new TestGlimmerComponent(owner);
      }
    },
    {
      type: 'classic component',
      target() {
        return TestClassicComponent.create({ renderer: {} });
      }
    }
  ];

  targets.map((t) => {
    test(`#wire - ${t.type}`, function(assert) {
      console.log('glimmer component class', GComponent);
      let service = this.owner.lookup('service:pusher');
      const target = t.target(this.owner);
      const targetId = target.toString();
      service.wire(target, 'channel-1', ['new-message']);
      assert.ok(service.bindings['channel-1']);
      assert.ok(service.bindings['channel-1'].events[targetId]);
      assert.equal(service.bindings['channel-1'].events[target.toString()].length, 1);
      assert.deepEqual(Object.keys(service.client.channels), ['channel-1']);
    });

    test(`#wireSubscriptions - ${t.type}`, function(assert) {
      let service = this.owner.lookup('service:pusher');
      const target = t.target(this.owner);
      const targetId = target.toString();
      service.wireSubscriptions(target);
      assert.ok(service.bindings['channel-1']);
      assert.ok(service.bindings['channel-1'].events[targetId]);
      assert.equal(service.bindings['channel-1'].events[target.toString()].length, 1);
      assert.deepEqual(Object.keys(service.client.channels), ['channel-1']);
    });

    test(`#unwire - ${t.type}`, function(assert) {
      let service = this.owner.lookup('service:pusher');
      const target = t.target(this.owner);
      service.wireSubscriptions(target);
      service.unwire(target, 'channel-1', ['new-message']);
      assert.notOk(service.bindings['channel-1']);
      assert.deepEqual(service.client.channels, {});
    });
  });
});

class TestController extends Controller {
  PUSHER_SUBSCRIPTIONS = {
    'channel-1': ['new-message']
  };
}

class TestRoute extends Route {
  PUSHER_SUBSCRIPTIONS = {
    'channel-1': ['new-message']
  };
}

const TestClassicComponent = Component.extend({
  init() {
    this._super(...arguments);
    this.PUSHER_SUBSCRIPTIONS = {
      'channel-1': ['new-message']
    };
  }
});

class TestGlimmerComponent extends GComponent {
  PUSHER_SUBSCRIPTIONS = {
    'channel-1': ['new-message']
  };
}
