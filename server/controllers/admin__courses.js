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
  }
}
