'use strict';

/**
 *  service.
 */

const Mux = require('@mux/mux-node')
const pluginId = require("../pluginId")

module.exports = {
  DEFAULT_CONFIG: {
    mux_access_key_id: "",
    mux_access_key_secret: "",
    mux_signing_key_id: "",
    mux_signing_private_key: ""
  },
  mux_client: null,
  isValidMuxConfig: function(config) {
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
    const fullconfig = {
      ...this.DEFAULT_CONFIG,
      ...config
    }
    return fullconfig
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
    pluginStore.set({ key: "config", value: newConfig })
    this.setMuxClient(newConfig)
  },
  getMuxClient: async function() {
    if (!this.mux_client) {
      const config = await this.getConfig()
      this.setMuxClient(config)
    }
    return this.mux_client
  },
  setMuxClient: function(config) {
    if (this.isValidMuxConfig(config)) {
      this.mux_client = new Mux(config.mux_access_key_id, config.mux_access_key_secret)
    }
  }
}
