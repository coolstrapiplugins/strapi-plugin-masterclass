'use strict';

module.exports = {
  async find(ctx) {
    const courses = await strapi.entityService.findMany("plugin::masterclass.mc-course",
      {
        filters: {},
        sort: { createdAt: "DESC" },
        populate: {
          students: {
            populate: {
              user: {
                select: ["id", "username", "email"]
              }
            }
          },
          category: {
            select: ["id", "title", "slug"]
          },
          featured_in: {
            select: ["id", "title", "slug"]
          },
          modules: {
            select: ["title"],
            populate: {
              lectures: {
                select: ["id", "title"],
                populate: {
                  video: {
                    select: ["video_id", "filename", "url", "duration"]
                  }
                }
              }
            }
          }
        }
      }
    )
    courses.forEach(course => {
      const modulesOrdered = strapi.service("plugin::masterclass.courses").orderModules(course)

      course.modules = modulesOrdered
    })
    ctx.body = { courses }
  },
  async linkLectures(ctx) {
    const { id } = ctx.params
    const { lectures: lecturesParam } = ctx.request.body
    const course = await strapi.entityService.findOne("plugin::masterclass.mc-course", id, {
      fields: ["duration"],
      populate: {
        lectures: {
          select: ["id"]
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
          select: ["duration"]
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
  },
  async listCourses(ctx) {
    const courses = await strapi.entityService.findMany("plugin::masterclass.mc-course", {
      filters: {},
      fields: ["title", "slug"]
    })
    ctx.body = {
      courses
    }
  },
  async create(ctx) {

    const course = await strapi.service("plugin::masterclass.courses").storeCourse({
      body: ctx.request.body,
      action: "create",
      id: null
    })

    ctx.body = { course }
  },
  async update(ctx) {
    const { id } = ctx.params

    const course = await strapi.service("plugin::masterclass.courses").storeCourse({
      body: ctx.request.body,
      action: "update",
      id
    })

    ctx.body = { course }
  }
}
