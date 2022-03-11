'use strict';

module.exports = {
  async getConfig(ctx) {
    const config = await strapi.service('plugin::masterclass.paypal').getConfig()
    return { config }
  },
  async setConfig(ctx) {
    const { config } = ctx.request.body
    await strapi.service('plugin::masterclass.paypal').setConfig(config)
    return { ok: true }
  }
}
