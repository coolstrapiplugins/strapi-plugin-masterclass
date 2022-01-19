'use strict';

/**
 *  service.
 */

module.exports = ({ strapi }) => ({
  /*
   *  registers student into a single course
   */
  async signIntoSingleCourse(user, course) {
    return await strapi.entityService.create("plugin::masterclass:mc-student-course", {
      data: {
        user,
        course
      }
    })
  },
  /*
   *  registers student into multiple courses
   */
  async signIntoMultipleCourses(user, courses) {
    const result = await Promise.all(courses.map(course => {
      return strapi.entityService.create("plugin::masterclass:mc-student-course", {
        data: {
          user,
          course
        }
      })
    }))
  }
})