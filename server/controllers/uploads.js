'use strict';

module.exports = {
  async update(ctx) {
    const { type: eventType, data: eventData } = ctx.request.body;

    switch (eventType) {
      case 'video.asset.ready': {
        // This means an Asset was successfully created! This is the final
        // state of an Asset in this stage of its lifecycle, so we don't need
        // to check anything first.
        await strapi.db.query("plugin::masterclass.mc-video").update({
          where: { temp_id: eventData.passthrough },
          data: {
            ready: true,
            video_id: eventData.playback_ids[0].id,
            duration: parseInt(eventData.duration)
          }
        })
        break;
      };
      case 'video.upload.cancelled': {
        // This fires when you decide you want to cancel an upload, so you
        // may want to update your internal state to reflect that it's no longer
        // active.
        console.log("video.upload.cancelled")
        console.log(JSON.stringify({eventData}))
      };
    }

    ctx.body = { ok: true }
  }
}
