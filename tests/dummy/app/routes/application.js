import { A } from '@ember/array';
import EmberObject from '@ember/object';
import Route from '@ember/routing/route';

export default Route.extend({
  model() {
    return A([
      EmberObject.create({ name: 'Channel 1', channel: 'channel-1' }),
      EmberObject.create({ name: 'Channel 2', channel: 'channel-2' }),
      EmberObject.create({ name: 'Channel 3', channel: 'channel-3' })
    ]);
  }
});
