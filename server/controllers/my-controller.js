'use strict';

module.exports = {
  index(ctx) {
    ctx.body = strapi
      .plugin('masterclass')
      .service('myService')
      .getWelcomeMessage();
  },
};
