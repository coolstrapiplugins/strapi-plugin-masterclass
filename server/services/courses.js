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
  orderModules(course) {
    let modulesOrdered = course.modules
    if (course.modules_order && course.modules_order.length > 0) {
      modulesOrdered = []
      course.modules_order.map(moduleID => {
        const module = course.modules.find(({id}) => id === moduleID)
        if (module) {
          module.lectures = this.orderLectures(module)
          modulesOrdered.push(module)
        }
      })
    }

    return modulesOrdered
  },
  orderLectures(module) {
    let lecturesOrdered = module.lectures
    if (module.lectures_order && module.lectures_order.length > 0) {
      lecturesOrdered = []
      module.lectures_order.map(lectureID => {
        const lecture = module.lectures.find(({id}) => id === lectureID)
        if (lecture) {
          lecturesOrdered.push(lecture)
        }
      })
    }

    return lecturesOrdered
  },
  async calculateDuration(lectures) {
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
        modules,
        category,
        featured_in
      }
    */

    let { modules } = body

    modules = await Promise.all(modules.map(async m => {
      m.duration = await this.calculateDuration(m.lectures)
      return m
    }))

    const duration = modules.reduce((totalDuration, module) => totalDuration + module.duration, 0)

    // Create modules if they don't have an ID.
    const modulesIDs = await Promise.all(modules.map(async m => {
      let module
      if (m.id) {
        // This is an existing module - update the title, duration, lectures, and lectures order
        module = await strapi.entityService.update("plugin::masterclass.mc-module", m.id, {
          data: {
            ...m,
            lectures_order: m.lectures
          }
        })
      } else {
        // This is a new module - create it and associate it with the lectures
        module = await strapi.entityService.create("plugin::masterclass.mc-module", {
          data: {
            ...m,
            lectures_order: m.lectures
          }
        })
      }
      return module.id
    }))

    const query = {
      data: {
        ...body,
        modules: modulesIDs,
        modules_order: modulesIDs,
        duration
      },
      populate: {
        modules: {
          populate: {
            lectures: {
              fields: ["id","title"]
            }
          }
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
