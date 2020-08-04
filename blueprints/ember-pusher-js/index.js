'use strict';

// eslint-disable-next-line node/no-unpublished-require
const VersionChecker = require('ember-cli-version-checker');

module.exports = {
  description: '',
  normalizeEntityName() {},

  afterInstall() {
    const checker = new VersionChecker(this.project);
    const emberVersion = checker.for('ember-source');

    if (emberVersion.lt('3.6.0')) {
      return this.addAddonToProject({
        name: 'ember-native-class-polyfill',
        target: '^1.0.6'
      });
    }
  }
};
