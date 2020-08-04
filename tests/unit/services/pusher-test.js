import Controller from '@ember/controller';
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

  test('#wire', function(assert) {
    let service = this.owner.lookup('service:pusher');
    const target = TestController.create();
    const targetId = target.toString();
    service.wire(target, 'channel-1', ['new-message']);
    assert.ok(service.bindings['channel-1']);
    assert.ok(service.bindings['channel-1'].events[targetId]);
    assert.equal(service.bindings['channel-1'].events[target.toString()].length, 1);
    assert.deepEqual(Object.keys(service.client.channels), ['channel-1']);
  });

  test('#wireSubscriptions', function(assert) {
    let service = this.owner.lookup('service:pusher');
    const target = TestController.create();
    const targetId = target.toString();
    service.wireSubscriptions(target);
    assert.ok(service.bindings['channel-1']);
    assert.ok(service.bindings['channel-1'].events[targetId]);
    assert.equal(service.bindings['channel-1'].events[target.toString()].length, 1);
    assert.deepEqual(Object.keys(service.client.channels), ['channel-1']);
    // Make sure willDestroy was update to unwire
    target.willDestroy();
    assert.notOk(service.bindings['channel-1']);
    assert.deepEqual(Object.keys(service.client.channels), []);
  });

  test('#unwire', function(assert) {
    let service = this.owner.lookup('service:pusher');
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

