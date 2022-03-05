'use strict';

/**
 *  service.
 */

const Mux = require('@mux/mux-node')
const AWS = require('aws-sdk');
const pluginId = require("../pluginId")

module.exports = {
  DEFAULT_CONFIG: {
    mux_access_key_id: "",
    mux_access_key_secret: "",
    mux_signing_key_id: "",
    mux_signing_private_key: "",
    aws_bucket: "",
    aws_region: "",
    aws_access_key_id: "",
    aws_access_key_secret: ""
  },
  mux_client: null,
  aws_client: null,
  isValidMuxConfig: function(config) {
    return (
      config.mux_access_key_id     !== "" &&
      config.mux_access_key_secret !== ""
    )
  },
  isValidAWSConfig: function(config) {
    return (
      config.aws_access_key_id     !== "" &&
      config.aws_access_key_secret !== ""
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
    pluginStore.set({ key: "config", value: newConfig})
    this.setMuxClient(newConfig)
  },
  getAWSClient: async function() {
    if (!this.aws_client) {
      const config = await this.getConfig()
      this.setAWSClient(config)
    }
    return this.aws_client
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
  },
  setAWSClient: function(config) {
    if (this.isValidAWSConfig(config)) {
      AWS.config.update({region: config.aws_region})

      this.aws_client = new AWS.S3({
        accessKeyId: config.aws_access_key_id,
        secretAccessKey: config.aws_access_key_secret
      })
    }
  }
}
