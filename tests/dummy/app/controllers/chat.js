import Controller from '@ember/controller';
import { computed } from '@ember/object';

export default Controller.extend({
  showUserList: computed.equal('channel.channel', 'channel-3'),

  actions: {
    sendMessage() {
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      const { channel } = this.channel;
      const event = 'new-message';
      const message = {
        author: this.author,
        body: this.body,
        timestamp: Date.now()
      }

      const body = JSON.stringify({ channel, event, message });
      fetch('/chat', { method: 'post', body, headers })
    }
  }
});
