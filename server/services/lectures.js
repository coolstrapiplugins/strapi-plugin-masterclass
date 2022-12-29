'use strict';

const fs = require('fs');
const request = require('request');
const uuid = require('uuid');

/**
 *  service.
 */

module.exports = ({ strapi }) => ({
  /**
   *  Create video and link to lecture
   */
  async storeLecture(data) {
    // Save video to database
    const newVideoData = {
      video_id: data.playback_ids[0].id,
      filename: data.id,
      duration: parseInt(data.duration),
      ready: true
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
      id: newLecture.id,
      title: data.id,
      video: newVideoData,
      courses: []
    }
  },
  /**
   * Upload video to Mux
   */
  async uploadVideo(video) {
    // Get mux client
    const muxClient = await strapi.service('plugin::masterclass.upload').getMuxClient()
    const config = await strapi.service('plugin::masterclass.upload').getConfig()
    if (!muxClient) {
      throw {
        status: "badRequest",
        msg: "Config is not valid",
        data: config
      }
    }

    const tempID = uuid.v1()

    let upload
    try {
      const { Video } = muxClient
      // upload.url is where the video will be put.
      upload = await Video.Uploads.create({
        new_asset_settings: {
          passthrough: tempID,
          playback_policy: 'signed'
        }
      })
    } catch(err) {
      console.log(err)
      throw {
        status: "internalServerError",
        msg: "Error on Video.Uploads.create"
      }
    }

    try {
      // Uplaod video to bucket
      await fs.createReadStream(video.path).pipe(request.put(upload.url))
    } catch(err) {
      console.log(err)
      throw {
        status: "internalServerError",
        msg: "Error on request.put"
      }
    }
    // Upload finished
    return tempID
  }
})
