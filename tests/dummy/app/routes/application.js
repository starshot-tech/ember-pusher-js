import Route from '@ember/routing/route';

export default class ApplicationRoute extends Route {
  model() {
    return [
      { name: 'Channel 1', channel: 'channel-1' },
      { name: 'Channel 2', channel: 'channel-2' },
      { name: 'Channel 3', channel: 'channel-3' }
    ]
  }
}
