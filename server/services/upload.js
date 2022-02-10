'use strict';

/**
 *  service.
 */

const Mux = require('@mux/mux-node')
const pluginId = require("../pluginId")

const { Video } = new Mux(process.env.MUX_TOKEN_ID, process.env.MUX_TOKEN_SECRET);

module.exports = {
  DEFAULT_CONFIG: {
    mux_access_key_id: "",
    mux_access_key_secret: ""
  },
  mux_client: null,
  isValidConfig: function(config) {
    return (
      config.mux_access_key_id     !== "" &&
      config.mux_access_key_secret !== ""
    )
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
    this.setMuxClient(config)
  },
  getMuxClient: async function() {
    if (!this.mux_client) {
      const config = await this.getConfig()
      this.setMuxClient(config)
    }
    return this.mux_client
  },
  setMuxClient: function(config) {
    if (this.isValidConfig(config)) {
      this.mux_client = new Mux(config.mux_access_key_id, config.mux_access_key_secret)
    }
  }
}
