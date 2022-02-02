'use strict';

module.exports = {
  async find(ctx) {
    const courses = await strapi.entityService.findMany("plugin::masterclass.mc-course",
      {
        filters: {},
        sort: { createdAt: "DESC" },
        populate: {
          lectures: {
            fields: ["id", "title"],
            populate: {
              video: {
                fields: ["video_id", "filename", "url", "duration"]
              }
            }
          },
          students: {
            populate: {
              user: {
                fields: ["id", "username", "email"]
              }
            }
          }
        }
      }
    )
    ctx.body = { courses }
  },
  async linkLectures(ctx) {
    const { id } = ctx.params
    const { lectures: lecturesParam } = ctx.request.body
    const course = await strapi.entityService.findOne("plugin::masterclass.mc-course", id, {
      fields: ["duration"],
      populate: {
        lectures: {
          fields: ["id"]
        }
      }
    })
    if (!course) {
      return ctx.badRequest("Course not found", {course})
    }
    // Lectures to link
    const lectures = await strapi.db.query("plugin::masterclass.mc-lecture").findMany({
      where: {
        id: lecturesParam
      },
      populate: {
        video: {
          fields: ["duration"]
        }
      }
    })
    if (!lectures || !lectures.length) {
      return ctx.badRequest("Could not find lectures", {lectures})
    }
    // Do not link a lecture and a course more than once
    const filteredLectures = lectures.filter(l => !course.lectures.some(({id}) => id === l.id))
    const newDuration = filteredLectures.reduce((total, {video}) => total + video.duration, 0)
    await strapi.entityService.update("plugin::masterclass.mc-course", id, {
      data: {
        lectures: course.lectures.concat(filteredLectures),
        duration: course.duration + newDuration
      }
    })
    return {ok: true}
  }
}
