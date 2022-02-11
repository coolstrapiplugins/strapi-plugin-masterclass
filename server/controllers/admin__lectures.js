'use strict';

const fs = require('fs');
const request = require('request');

module.exports = {
  async find(ctx) {
    const lectures = await strapi.entityService
    .findMany("plugin::masterclass.mc-lecture",
      {
        filters: {},
        populate: {
          course: {
            fields: ["id", "title"]
          },
          video: {
            fields: ["video_id", "filename", "duration", "url"]
          }
        }
      }
    )
    ctx.body = { lectures }
  },
  async create(ctx) {
    const { files, body } = ctx.request
    if (!files || !files.video) {
      return ctx.badRequest("There is no video")
    }
    const data = JSON.parse(body.data)
    if (!data || !data.title) {
      return ctx.badRequest("Title must be specified")
    }

    // Get mux client
    const muxClient = await strapi.service('plugin::masterclass.upload').getMuxClient()
    const config = await strapi.service('plugin::masterclass.upload').getConfig()
    if (!muxClient) {
      return ctx.badRequest("Config is not valid: " + JSON.stringify(config))
    }


    const { video } = files
    const { title } = data
    const filename = video.name


    let upload
    try {
      const { Video } = muxClient
      // upload.url is where the video will be put.
      upload = await Video.Uploads.create({
        new_asset_settings: {
          playback_policy: 'public'
        }
      })
    } catch(err) {
      console.log(err)
      return ctx.internalServerError("Error on Video.Uploads.create")
    }
    const video_id = upload.id
    try {
      // Uplaod video to bucket
      fs.createReadStream(video.path).pipe(request.put(upload.url))
    } catch(err) {
      console.log(err)
      return ctx.internalServerError("Error on request.put")
    }
    // Upload finished
    const fileBuffer = readFileSync(video.path)

    // Extract duration in seconds from video
    const header = Buffer.from("mvhd");
    const start = fileBuffer.indexOf(header) + 17;
    const timeScale = fileBuffer.readUInt32BE(start, 4);
    const duration = fileBuffer.readUInt32BE(start + 4, 4);
    const audioLength = Math.floor(duration/timeScale * 1000) / 1000;
    const seconds = parseFloat(audioLength.toFixed(0))

    // Save video to database
    const newVideoData = {
      video_id,
      filename,
      duration: seconds
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
  async upload(ctx) {
    console.log("files:")
    console.log(JSON.stringify(ctx.request.files))
    /*
      {
        "size": 28924,
        "path": "C:\\Windows\\TEMP\\upload_cf5ca259a73f4a63c766a056f37344a5",
        "name": "VID-20190701-WA0031.mp4",
        "type": "video/mp4",
        "mtime": "2022-01-16T23:07:43.820Z"
      }
    */
    console.log("body:")
    const data = JSON.parse(ctx.request.body.data)
    console.log(data)
    return {ok: true}
  }
}
