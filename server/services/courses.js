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
    let student = await strapi.db.query("plugin::masterclass.mc-student").findOne({
      where: {user: user.id}
    })
    if (!student) {
      student = await strapi.entityService.create("plugin::masterclass.mc-student", {
        data: {
          user: user.id
        }
      })
    }
    return await Promise.all(courses.map(course => {
      return strapi.entityService.create("plugin::masterclass.mc-student-course", {
        data: {
          student: student.id,
          course: course.id
        }
      })
    }))
  }
})