'use strict';
const OSS = require('ali-oss');
const { readFileSync } = require('fs')

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
    // Get VOD client and config
    const vodClient = await strapi.service('plugin::masterclass.upload').getVODClient()
    const config = await strapi.service('plugin::masterclass.upload').getConfig()
    if (!vodClient) {
      return ctx.badRequest("Config is not valid: " + JSON.stringify(config))
    }
    const { video } = files
    const { title } = data
    const filename = video.name
    const params = {
      "RegionId": config.VOD_region,
      "Title": title,
      "FileName": filename,
      "TemplateGroupId": config.VOD_template_group_id,
      timeout: 60 * 1000,
    }
    const requestOption = {
      method: 'POST'
    }
    let createReqResult
    try {
      // Create request to upload video to Apsara VOD
      createReqResult = await vodClient.request('CreateUploadVideo', params, requestOption)
    } catch(err) {
      console.log(err)
      return ctx.internalServerError("Error on CreateUploadVideo")
    }
    const video_id = createReqResult.VideoId
    // Parse base64-encoded values
    let buff = Buffer.from(createReqResult.UploadAddress, 'base64');
    const uploadAddress = JSON.parse(buff.toString())
    buff = Buffer.from(createReqResult.UploadAuth, 'base64');
    const uploadAuth = JSON.parse(buff.toString())
    // Create new OSS client
    const ossVideoClient = new OSS({
      accessKeyId: uploadAuth.AccessKeyId,
      accessKeySecret: uploadAuth.AccessKeySecret,
      stsToken: uploadAuth.SecurityToken,
      region: uploadAuth.Region,
      bucket: uploadAddress.Bucket,
      endpoint: uploadAddress.Endpoint,
      timeout: 60 * 1000,
      refreshSTSToken: async () => {
        var params = {
          "RegionId": config.VOD_region,
          "VideoId": video_id
        }
        var requestOption = {
          method: 'POST'
        };
        try {
          const result = await vodClient.request('RefreshUploadVideo', params, requestOption)
          // Parse base64-encoded values
          const buff = Buffer.from(result.UploadAuth, 'base64');
          const uploadAuth = JSON.parse(buff.toString())
          return uploadAuth
        } catch(err) {
          console.log("Could not refresh STS token:", err)
          return null
        }
      }
    })
    const fileBuffer = readFileSync(video.path)
    let uploadReqResult
    try {
      // Uplaod video to bucket
      uploadReqResult = await ossVideoClient.put(uploadAddress.FileName, fileBuffer)
    } catch(err) {
      console.log(err)
      return ctx.internalServerError("Error on ossVideoClient.put")
    }
    // Upload finished

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
      duration: seconds,
      url: uploadReqResult.url
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
