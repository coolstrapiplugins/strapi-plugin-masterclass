'use strict';

/**
 *  service.
 */

const pluginId = require("../pluginId")

module.exports = {
  paypal_auth: null,
  DEFAULT_CONFIG: {
    paypal_client_id: "",
    paypal_client_secret: ""
  },
  /**
   * Retrieve the strapi data storage for the plugin
   */
  getStore: function() {
    return strapi.store({
      type: "plugin",
      name: pluginId
    })
  },
  isValidConfig: function(config) {
    return (
      config.paypal_client_id     !== "" &&
      config.paypal_client_secret !== ""
    )
  },
  getConfig: async function() {
    const pluginStore = this.getStore()
    const config = await pluginStore.get({ key: "config"})
    if (!config) {
      return this.DEFAULT_CONFIG
    }
    return config
  },
  setConfig: async function(newConfigInput) {
    const config = await this.getConfig()
    for (const key in newConfigInput) {
      if (newConfigInput[key] === null) {
        delete newConfigInput[key]
      }
    }
    const newConfig = {...config, ...newConfigInput}
    const pluginStore = this.getStore()
    pluginStore.set({ key: "config", value: newConfig})
    this.setPaypalAuth(newConfig)
  },
  getPaypalAuth: async function() {
    if (!this.paypal_auth) {
      const config = await this.getConfig()
      this.setPaypalAuth(config)
    }
    return this.paypal_auth
  },
  setPaypalAuth: function(config) {
    if (this.isValidConfig(config)) {
      this.paypal_auth = {
        username: config.paypal_client_id,
        password: config.paypal_client_secret
      }
    }
  }
}
