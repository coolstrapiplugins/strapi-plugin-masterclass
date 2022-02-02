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
      video_id: data.VideoId,
      filename: data.Title,
      duration: parseInt(data.Duration)
    }
    const newVideo = await strapi.entityService.create("plugin::masterclass.mc-video",
      { data: newVideoData }
    )
    // Then create lecture and link the video ID
    const newLectureData = {
      title: data.Title,
      video: newVideo.id
    }
    const newLecture = await strapi.entityService.create("plugin::masterclass.mc-lecture",
      { data: newLectureData }
    )
    return {
      title: data.Title,
      video: newVideoData
    }
  }
})