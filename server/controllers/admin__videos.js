'use strict';

module.exports = {
  async find(ctx) {
    const videos = await strapi.entityService.findMany("plugin::masterclass.mc-video", {
      filter: {},
      fields: ["video_id", "filename", "duration"]
    })
    ctx.body = {
      videos
    }
  }
}