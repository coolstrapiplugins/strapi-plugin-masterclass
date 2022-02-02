'use strict';

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
    // Get VOD client and config
    const vodClient = await strapi.service('plugin::masterclass.upload').getVODClient()
    const config = await strapi.service('plugin::masterclass.upload').getConfig()
    if (!vodClient) {
      return ctx.badRequest("Config is not valid", config)
    }
    const params = {
      "RegionId": config.VOD_region,
      "Status": "Normal"
    }
    const requestOption = {
      method: 'POST'
    }
    let result
    try {
      // Create request to upload video to Apsara VOD
      result = await vodClient.request('GetVideoList', params, requestOption)
    } catch(err) {
      console.log(err)
      return ctx.internalServerError("Error on GetVideoList")
    }
    const { Video } = result.VideoList
    await Promise.all(Video.map(async v => {
      // Check first if the video ID is unique
      const video = await strapi.db.query("plugin::masterclass.mc-video").findOne({
        where: {
          video_id: v.VideoId
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
