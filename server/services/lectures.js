'use strict';

/**
 *  service.
 */

module.exports = ({ strapi }) => ({
  /*
   *  Create video and link to lecture
   */
  async storeLecture(data) {
    // Save video to database
    const newVideoData = {
      video_id: data.playback_ids[0].id,
      filename: data.id,
      duration: parseInt(data.duration)
    }
    const newVideo = await strapi.entityService.create("plugin::masterclass.mc-video",
      { data: newVideoData }
    )
    // Then create lecture and link the video ID
    const newLectureData = {
      title: data.id,
      video: newVideo.id
    }
    const newLecture = await strapi.entityService.create("plugin::masterclass.mc-lecture",
      { data: newLectureData }
    )
    return {
      title: data.id,
      video: newVideoData
    }
  }
})