'use strict';

const fs = require('fs');
const request = require('request');
const uuid = require('uuid');
const axios = require('axios')

module.exports = {
  async find(ctx) {
    let lectures = await strapi.entityService
    .findMany("plugin::masterclass.mc-lecture",
      {
        filters: {},
        populate: {
          video: {
            select: ["video_id", "filename", "duration", "url"]
          }
        }
      }
    )
    lectures = await Promise.all(lectures.map(async lecture => {
      // Get the modules where this lecture is in.
      const modules = await strapi.db.query("plugin::masterclass.mc-module").findMany({
        where: {
          lectures: [lecture.id]
        },
        populate: {
          course: {
            select: ["title", "id"]
          }
        }
      })
      const courses = modules.map(m => m.course)

      const uniqueCourses = courses.reduce((dict, course) => {
        dict[`${course.title}-${course.id}`] = course
        return dict
      }, {})

      lecture.courses = []

      for (const key in uniqueCourses) {
        lecture.courses.push(uniqueCourses[key])
      }

      return lecture
    }))
    ctx.body = { lectures }
  },
  async create(ctx) {
    const { files, body } = ctx.request
    if (!files || !files.video) {
      return ctx.badRequest("There should be a video")
    }
    const data = JSON.parse(body.data)
    if (!data || !data.title) {
      return ctx.badRequest("Title must be specified")
    }

    const { title } = data
    const filename = files.video.name

    let tempID

    try {
      tempID = await strapi.service('plugin::masterclass.lectures').uploadVideo(files.video)
    } catch(err) {
      return ctx[err.status](err.msg, err.data)
    }

    // Save video to database
    const newVideoData = {
      temp_id: tempID,
      filename,
      ready: false
    }
    const newVideo = await strapi.entityService.create("plugin::masterclass.mc-video",
      { data: newVideoData }
    )
    // Then create lecture and link the video ID
    const newLectureData = {
      title,
      video: newVideo.id
    }
    const newLecture = await strapi.entityService.create("plugin::masterclass.mc-lecture",
      { data: newLectureData }
    )

    return {
      newLecture: {
        title,
        id: newLecture.id,
        video: newVideoData
      }
    }
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
    const lectures = await Promise.all(data.map(async v => {
      // Check first if the video ID is unique
      const id = v.playback_ids[0].id
      const video = await strapi.db.query("plugin::masterclass.mc-video").findOne({
        where: {
          video_id: id
        }
      })
      if (video) {
        // Don't store video as it already exists
        return null
      }
      return await strapi.service('plugin::masterclass.lectures').storeLecture(v)
    }))
    ctx.body = { lectures: lectures.filter(l => l != null) }
  },
  async update(ctx) {
    const { id } = ctx.params
    const { files, body } = ctx.request

    let tempID

    if (files && files.video) {
      try {
        tempID = await strapi.service('plugin::masterclass.lectures').uploadVideo(files.video)
      } catch(err) {
        return ctx[err.status](err.msg, err.data)
      }
    }
    const data = JSON.parse(body.data)
    const {
      title,
      filename,
      playbackID
    } = data

    const newLectureData = {
      title
    }

    if (playbackID) {
      // we're updating the video linked to this lecture
      const video = await strapi.db.query("plugin::masterclass.mc-video").findOne({
        where: {
          video_id: playbackID
        }
      })
      if (!video) {
        return ctx.badRequest("A video with the given playback ID does not exist", {playbackID})
      }
      newLectureData.video = video.id

      // Update the video's information
      await strapi.db.query("plugin::masterclass.mc-video").update({
        where: {
          video_id: playbackID
        },
        data: {
          filename,
          temp_id: tempID
        }
      })
    } else {
      // To create a new video, at least it must have a tempID or filename
      if (tempID || filename) {
        // create new video an link it to this lecture.
        const newVideoData = {
          temp_id: tempID,
          filename,
          ready: false
        }
        const newVideo = await strapi.entityService.create("plugin::masterclass.mc-video",
          { data: newVideoData }
        )
        newLectureData.video = newVideo.id
      } else {
        newLectureData.video = null
      }
    }

    // finally, update the lecture
    const lecture = await strapi.entityService.update("plugin::masterclass.mc-lecture", id, {
      data: newLectureData,
      fields: ["id", "title"],
      populate: {
        video: {
          fields: ["video_id", "filename", "duration"]
        }
      }
    })

    ctx.body = { lecture }
  },
  async listLectures(ctx) {
    const lectures = await strapi.entityService.findMany("plugin::masterclass.mc-lecture", {
      filters: {},
      fields: ["title"],
      populate: {
        video: {
          fields: ["duration"]
        }
      }
    })
    ctx.body = {
      lectures
    }
  }
}
