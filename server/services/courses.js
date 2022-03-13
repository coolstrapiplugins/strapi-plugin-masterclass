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
      where: {user: user.id},
      populate: {
        courses: {
          select: ["id"]
        }
      }
    })
    if (!student) {
      student = await strapi.entityService.create("plugin::masterclass.mc-student", {
        data: {
          user: user.id
        },
        populate: {
          courses: {
            select: ["id"]
          }
        }
      })
    }
    const newCourses = courses.filter(c => {
      const alreadySignedIn = student.courses.some(({id}) => id === c.id)
      return !alreadySignedIn
    })
    return await Promise.all(newCourses.map(c => {
      return strapi.entityService.create("plugin::masterclass.mc-student-course", {
        data: {
          student: student.id,
          course: c.id
        }
      })
    }))
  },
  async buildAbsoluteSlug(course) {
    let { category: { id: c_id } } = course
    const slugs = []
    let category = {}
    do {
      category = await strapi.entityService.findOne("plugin::masterclass.mc-category", c_id, {
        fields: ["slug"],
        populate: {
          parent_category: {
            fields: ["id"]
          }
        }
      })
      slugs.unshift(category.slug)
      if (category.parent_category) {
        c_id = category.parent_category.id
      }
    } while (category.parent_category !== null)

    return slugs.join("/")
  }
})