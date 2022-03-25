'use strict';

module.exports = {
  async find(ctx) {
    const courses = await strapi.entityService.findMany("plugin::masterclass.mc-course",
      {
        filters: {},
        sort: { createdAt: "DESC" },
        populate: {
          lectures: {
            select: ["id", "title"],
            populate: {
              video: {
                select: ["video_id", "filename", "url", "duration"]
              }
            }
          },
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
          }
        }
      }
    )
    courses.forEach(course => {
      const lecturesOrdered = strapi.service("plugin::masterclass.courses").orderLectures(course)

      course.lectures = lecturesOrdered
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
    // ctx.request.body -> { title, slug, price, description, long_description }
    const course = await strapi.entityService.create("plugin::masterclass.mc-course", {
      data: ctx.request.body,
      populate: {
        lectures: {
          fields: ["id","title"]
        },
        category: {
          fields: ["id","slug","title"]
        },
        featured_in: {
          fields: ["id","slug","title"]
        },
        students: {
          fields: []
        }
      }
    })
    ctx.body = { course }
  },
  async update(ctx) {
    const { id } = ctx.params
    // ctx.request.body
    /* ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓
      {
        title,
        slug,
        price,
        description,
        long_description,
        lectures,
        category,
        featured_in
      }
    */
    const { lectures } = ctx.request.body

    const storedLectures = await strapi.entityService.findMany("plugin::masterclass.mc-lecture", {
      filters: {
        id: lectures
      },
      populate: {
        video: {
          fields: ["duration"]
        }
      }
    })
    const duration = storedLectures.reduce((totalDuration, lecture) => {
      if (lecture.video) {
        totalDuration += lecture.video.duration
      }
      return totalDuration
    }, 0)
    const course = await strapi.entityService.update("plugin::masterclass.mc-course", id, {
      data: {
        ...ctx.request.body,
        lectures_order: lectures,
        duration
      },
      populate: {
        lectures: {
          fields: ["id","title"]
        },
        category: {
          fields: ["id","slug","title"]
        },
        featured_in: {
          fields: ["id","slug","title"]
        },
        students: {
          fields: []
        }
      }
    })
    ctx.body = { course }
  }
}
