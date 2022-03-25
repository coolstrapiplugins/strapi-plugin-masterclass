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
  },
  orderLectures(course) {

    let lecturesOrdered = course.lectures
    if (course.lectures_order && course.lectures_order.length > 0) {
      lecturesOrdered = []
      course.lectures_order.map(lectureID => {
        const lecture = course.lectures.find(({id}) => id === lectureID)
        if (lecture) {
          lecturesOrdered.push(lecture)
        }
      })
    }

    return lecturesOrdered
  },
  async calculateCourseDuration(lectures) {
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
    return storedLectures.reduce((totalDuration, lecture) => {
      if (lecture.video) {
        totalDuration += lecture.video.duration
      }
      return totalDuration
    }, 0)
  },
  /**
  * Create or update course
  */
  async storeCourse({body, action, id}) {

    /** body:
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

    const { lectures } = body
    const duration = await this.calculateCourseDuration(lectures)

    const query = {
      data: {
        ...body,
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
    }

    let params = [query]

    if (id != null) {
      params = [id, query]
    }

    return strapi.entityService[action]("plugin::masterclass.mc-course", params[0], params[1])
  }
})
