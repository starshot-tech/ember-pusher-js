import Controller from '@ember/controller';
import { action } from '@ember/object';

export default class ChatController extends Controller {
  @action
  sendMessage(e) {
    e.preventDefault();

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
