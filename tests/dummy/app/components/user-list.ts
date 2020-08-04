import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import PusherService, { PusherSubscriber } from 'ember-pusher-js/services/pusher';

interface User {
  id: string;
  name: string;
}

export default class UserListComponent extends Component implements PusherSubscriber {
  @service pusher!: PusherService;
  @tracked users: User[] = [];

  PUSHER_SUBSCRIPTIONS = {
    'user-list': ['user-arrive', 'user-leave']
  }

  constructor(owner: any, args: any) {
    super(owner, args);
    this.pusher.wireSubscriptions(this);
  }

  @action
  userArrive(msg: {id: string, name: string}) {
    this.users = [...this.users, msg];
  }

  @action
  userLeave(msg: {id: string, name: string}) {
    this.users = this.users.filter((user) => user.id !== msg.id);
  }
}
