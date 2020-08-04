import { module, test } from 'qunit';
import { visit, currentURL, findAll } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { PusherMock } from 'pusher-js-mock';

module('Acceptance | wire subscriptions', function(hooks) {

  setupApplicationTest(hooks);

  test('#wireSubscriptions on a route | classic', async function(assert) {
    const pusherService = this.owner.lookup('service:pusher');
    pusherService.client = new PusherMock();

    await visit('/chat/channel-2');
    assert.equal(currentURL(), '/chat/channel-2');

    assert.ok(pusherService.client.channels['channel-2'], 'should subscribe to the proper channel');
    assert.equal(findAll('[data-test-message]').length, 0, 'should not show any messages on load');

    // Emit a message to the event the route subscribed to using pusher mock
    pusherService.bindings['channel-2'].channel.emit('new-message', { author: 'Tomster', body: 'Ember.js is very cool!', timestamp: Date.now() });
    assert.equal(findAll('[data-test-message]').length, 1, 'should append a message from pusher');
  });

  test('#wireSubscriptions on a glimmer component', async function(assert) {
    const pusherService = this.owner.lookup('service:pusher');
    pusherService.client = new PusherMock();

    await visit('/chat/channel-3');
    assert.equal(currentURL(), '/chat/channel-3');

    assert.ok(pusherService.client.channels['user-list'], 'should subscribe from the glimmer component');
    assert.equal(findAll('[data-test-user]').length, 0, 'should not show any users on load');

    pusherService.bindings['user-list'].channel.emit('user-arrive', { id: 1, name: 'Yehuda' });
    assert.equal(findAll('[data-test-user]').length, 1, 'should append a user from pusher in glimmer component');

    pusherService.bindings['user-list'].channel.emit('user-leave', { id: 1, name: 'Yehuda' });
    assert.equal(findAll('[data-test-user]').length, 0, 'should remove a user from pusher in glimmer component');
  });
});
