import Controller from '@ember/controller';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { PusherChannelMock } from 'pusher-js-mock';
import { settled } from '@ember/test-helpers';

module('Unit | Service | pusher | classic', function(hooks) {
  setupTest(hooks);

  let service;

  hooks.afterEach(() => {
    if (service) {
      service.unsubscribeAll();
    }
  });

  // Replace this with your real tests.
  test('it exists', function(assert) {
    service = this.owner.lookup('service:pusher');
    assert.ok(service);
  });

  test('#subscribe', function(assert) {
    service = this.owner.lookup('service:pusher');

    const channel = service.subscribe('channel-1');
    assert.equal(channel instanceof PusherChannelMock, true);
    assert.equal(channel.name, 'channel-1');
  });

  test('#wire', async function(assert) {
    service = this.owner.lookup('service:pusher');
    const target = TestController.create();
    const targetId = target.toString();
    service.wire(target, 'channel-1', ['new-message']);
    assert.ok(service.bindings['channel-1'], 'should add a binding entry for the channel passed');
    assert.ok(service.bindings['channel-1'].events[targetId], 'should add an events array on the binding entry for the target ID');
    assert.equal(service.bindings['channel-1'].events[target.toString()].length, 1, 'should add an object to the target\'s events array');
    assert.deepEqual(Object.keys(service.client.channels), ['channel-1'], 'should subscribe via pusherjs to channel passed in');
    // Test auto-unwire on object destruction
    target.destroy();
    await settled();
    assert.notOk(service.bindings['channel-1'], 'should remove channel binding on destroy');
    assert.deepEqual(Object.keys(service.client.channels), [], 'should unsubscribe via pusherjs on destroy');
  });

  test('#wireSubscriptions', function(assert) {
    service = this.owner.lookup('service:pusher');
    const target = TestController.create();
    const targetId = target.toString();
    service.wireSubscriptions(target);
    assert.ok(service.bindings['channel-1']);
    assert.ok(service.bindings['channel-1'].events[targetId]);
    assert.equal(service.bindings['channel-1'].events[target.toString()].length, 1);
    assert.deepEqual(Object.keys(service.client.channels), ['channel-1']);
  });

  test('#unwire', function(assert) {
    service = this.owner.lookup('service:pusher');
    const target = TestController.create();
    service.wireSubscriptions(target);
    service.unwire(target, 'channel-1', ['new-message']);
    assert.notOk(service.bindings['channel-1']);
    assert.deepEqual(service.client.channels, {});
  });
});

class TestController extends Controller {
  PUSHER_SUBSCRIPTIONS = {
    'channel-1': ['new-message']
  };
}

