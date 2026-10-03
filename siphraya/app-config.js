// LP360 compatibility bridge — endpoints live only in /sites-config.js
(() => {
  'use strict';
  if (!window.APP_CONFIG) {
    throw new Error('LP360: sites-config.js must be loaded before app-config.js');
  }
})();
