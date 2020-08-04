import { A } from '@ember/array';
import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default Route.extend({
  pusher: service(),

  model(params) {
    const channel = this.modelFor('application').find((ch) => ch.channel === params.channel);
    return {
      channel,
      messages: A()
    };
  },

  afterModel(model) {
    this.PUSHER_SUBSCRIPTIONS = {}
    this.PUSHER_SUBSCRIPTIONS[model.channel.channel] = ['new-message'];
    this.pusher.wireSubscriptions(this);
  },

  setupController(controller, model) {
    this._super(...arguments);
    controller.set('messages', model.messages);
    controller.set('channel', model.channel);
  },

  actions: {
    newMessage(message) {
      this.controller.messages.pushObject(message);
    }
  }
});
