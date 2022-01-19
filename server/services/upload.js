'use strict';

/**
 *  service.
 */

const Core = require('@alicloud/pop-core');
const pluginId = require("../pluginId")

module.exports = {
  DEFAULT_CONFIG: {
    OSS_access_key_id: "",
    OSS_access_key_secret: "",
    VOD_region: "",
    VOD_template_group_id: ""
  },
  VOD_client: null,
  isValidConfig: function(config) {
    return (
      config.OSS_access_key_id     !== "" &&
      config.OSS_access_key_secret !== "" &&
      config.VOD_region            !== "" &&
      config.VOD_template_group_id !== ""
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
    this.setVODClient(config)
  },
  getVODClient: async function() {
    if (!this.VOD_client) {
      const config = await this.getConfig()
      this.setVODClient(config)
    }
    return this.VOD_client
  },
  setVODClient: function(config) {
    if (this.isValidConfig(config)) {
      this.VOD_client = new Core({
        accessKeyId: config.OSS_access_key_id,
        accessKeySecret: config.OSS_access_key_secret,
        endpoint: `https://vod.${config.VOD_region}.aliyuncs.com`,
        apiVersion: '2017-03-21',
        timeout: 60 * 1000
      });
    }
  }
}
