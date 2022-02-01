'use strict';

/**
 *  service.
 */

const stripe = require('stripe')
const pluginId = require("../pluginId")

module.exports = {
  stripe_client: null,
  /**
   * Retrieve the strapi data storage for the plugin
   */
  getStore: function() {
    return strapi.store({
      type: "plugin",
      name: pluginId
    })
  },
  getStripePk: async function() {
    const pluginStore = this.getStore()
    return await pluginStore.get({ key: "stripe_pk"})
  },
  setStripePk: async function(newPk) {
    const pluginStore = this.getStore()
    pluginStore.set({ key: "stripe_pk", value: newPk})
    this.setStripeClient(newPk)
  },
  getStripeClient: async function() {
    if (!this.stripe_client) {
      const pk = await this.getStripePk()
      this.setStripeClient(pk)
    }
    return this.stripe_client
  },
  setStripeClient: function(pk) {
    if (pk) {
      this.stripe_client = new stripe(pk)
    }
  }
}
