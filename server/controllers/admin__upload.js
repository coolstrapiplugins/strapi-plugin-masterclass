'use strict';
const axios = require('axios')

module.exports = {
  async getConfig(ctx) {
    const config = await strapi.service('plugin::masterclass.upload').getConfig()
    return { config }
  },
  async setConfig(ctx) {
    const { config } = ctx.request.body
    await strapi.service('plugin::masterclass.upload').setConfig(config)
    return { ok: true }
  },
  async getVideoList(ctx) {
    // Get Mux api key and secret
    const config = await strapi.service('plugin::masterclass.upload').getConfig()
    const {
      mux_access_key_id,
      mux_access_key_secret
    } = config

    if (!mux_access_key_id || !mux_access_key_secret) {
      return ctx.badRequest("Config is not valid", config)
    }

    let result
    try {
      const url = "https://api.mux.com/video/v1/assets"
      const user = `${mux_access_key_id}:${mux_access_key_secret}`
      result = await axios.get(url, {
        headers: {
          Authorization: `Basic ${Buffer.from(user).toString("base64")}`
        }
      })
    } catch(err) {
      console.log(err)
      return ctx.internalServerError("Error while fetching video list")
    }
    const { data: { data } } = result
    await Promise.all(data.map(async v => {
      // Check first if the video ID is unique
      const id = v.playback_ids[0].id
      const video = await strapi.db.query("plugin::masterclass.mc-video").findOne({
        where: {
          video_id: id
        }
      })
      if (video) {
        // Don't store video as it already exists
        return
      }
      return await strapi.service('plugin::masterclass.lectures').storeLecture(v)
    }))
    ctx.body = {ok: true}
  }
}
