import { A } from '@ember/array';
import { action } from '@ember/object';
import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class ChatRoute extends Route {
  @service pusher;

  model(params) {
    const channel = this.modelFor('application').find((ch) => ch.channel === params.channel);
    return {
      channel,
      messages: A()
    };
  }

  afterModel(model) {
    const { channel } = model.channel;
    this.pusher.wire(this, channel, ['new-message']);
  }

  setupController(controller, model) {
    super.setupController(controller, model);
    controller.set('messages', model.messages);
    controller.set('channel', model.channel);
  }

  @action
  newMessage(message) {
    this.controller.messages.pushObject(message);
  }
}
