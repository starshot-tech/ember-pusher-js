import Router from '@ember/routing/route';

export default Router.extend({
  model() {
    return this.modelFor('application');
  }
})
