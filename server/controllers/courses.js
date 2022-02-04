'use strict';

module.exports = {
  async find(ctx) {
    const courses = await strapi.entityService.findMany("plugin::masterclass.mc-course", {
      filters: {},
      populate: {
        thumbnail: {
          fields: ["name", "url"]
        },
        lectures: {
          fields: ["title"],
          populate: {
            video: {
              fields: ["duration"]
            }
          }
        }
      }
    })
    return { courses }
  },
  async findOne(ctx) {
    const { slug } = ctx.params
    const course = await strapi.db.query("plugin::masterclass.mc-course").findOne({
      where: { slug },
      select: [
        "id",
        "duration",
        "title",
        "description",
        "price",
        "slug"
      ],
      populate: {
        thumbnail: {
          fields: ["name", "url"]
        },
        lectures: {
          fields: ["title"],
          populate: {
            video: {
              fields: ["duration"]
            }
          }
        }
      }
    })
    return course
  },
  async findSlugs(ctx) {
    const courses = await strapi.entityService.findMany("plugin::masterclass.mc-course", {
      filters: {},
      fields: ["slug"]
    })
    return { courses }
  },
  /*
  * Get the classes the user (if any) has marked as seen and the number of students
  */
  async getCourseDetails(ctx) {
    const { user } = ctx.state
    const { id } = ctx.params
    let classesCompleted = []
    if (user) {
      // Get user progress
      const student = await strapi.db.query(
        "plugin::masterclass.mc-student-course"
      ).findOne(
        {
          where: {
            student: user.id,
            course: id
          },
          populate: {
            lectures_seen: {
              fields: ["id"]
            }
          }
        }
      )
      if (student) {
        classesCompleted = student.lectures_seen
      }
    }
    const students = await strapi.db.query("plugin::masterclass.mc-student-course").count({
      where: {
        course: { id }
      }
    })

    return {
      classesCompleted,
      students
    }
  },
  /*
  * Get user progress
  */
  async getClassesCompleted(ctx) {
    const { user } = ctx.state
    const { id } = ctx.params
    if (!user) {
      return ctx.badRequest("There must be an user")
    }
    const student = await strapi.db.query(
      "plugin::masterclass.mc-student-course"
    ).findOne(
      {
        where: {
          student: user.id,
          course: id
        },
        populate: {
          lectures_seen: {
            fields: ["id"]
          }
        }
      }
    )
    if (!student) {
      return ctx.badRequest("No access to this course")
    }
    return {
      classesCompleted: student.lectures_seen
    }
  },
  /*
  * Resume course
  */
  async resumeCourse(ctx) {
    const { user } = ctx.state
    const { id } = ctx.params
    if (!user) {
      return ctx.badRequest("There must be an user")
    }
    const student = await strapi.db.query(
      "plugin::masterclass.mc-student-course"
    ).findOne(
      {
        where: {
          student: user.id,
          course: id
        },
        populate: {
          course: {
            populate: {
              lectures: {
                populate: {
                  video: {
                    fields: ["id", "video_id"]
                  }
                }
              }
            }
          },
          lectures_seen: {
            fields: ["id"]
          },
          currentLecture: {
            fields: ["id"],
            populate: {
              video: {
                fields: ["video_id"]
              }
            }
          }
        }
      }
    )
    if (!student) {
      return ctx.badRequest("No access to this course")
    }
    const currentLecture = student.current_lecture || student.course.lectures[0]

    const config = await strapi.service('plugin::masterclass.upload').getConfig()
    const vodClient = await strapi.service('plugin::masterclass.upload').getVODClient()
    if (!vodClient) {
      return ctx.badRequest("VOD client is not properly configured")
    }

    const params = {
      "RegionId": config.VOD_region,
      "VideoId": currentLecture.video.video_id
    }
    const requestOption = {
      method: 'POST'
    }
    let result
    try {
      result = await vodClient.request('GetVideoPlayAuth', params, requestOption)
    } catch(err) {
      console.log(err)
      return ctx.internalServerError("Error on GetVideoPlayAuth")
    }
    return {
      PlayAuth: result.PlayAuth,
      VideoId: currentLecture.video.video_id,
      classesCompleted: student.lectures_seen,
      currentLectureID: currentLecture.id
    }
  },
  /*
  * Get play auth for the given lecture
  */
  async getPlayAuth(ctx) {
    const { user } = ctx.state
    if (!user) {
      return ctx.badRequest("There must be an user")
    }
    const { id } = ctx.params
    const { lecture } = ctx.query
    const student = await strapi.db.query(
      "plugin::masterclass.mc-student-course"
    ).findOne(
      {
        where: {
          student: user.id,
          course: id
        },
        populate: {
          lectures_seen: {
            fields: ["id"]
          }
        }
      }
    )
    if (!student) {
      return ctx.badRequest("No access to this course")
    }

    const newCurrentLecture = await strapi.db.query(
      "plugin::masterclass.mc-lecture"
    ).findOne(
      {
        where: {
          id: lecture
        },
        populate: {
          video: {
            fields: ["video_id"]
          }
        }
      }
    )
    if (!newCurrentLecture) {
      return ctx.badRequest("The lecture does not exist")
    }

    const config = await strapi.service('plugin::masterclass.upload').getConfig()
    const vodClient = await strapi.service('plugin::masterclass.upload').getVODClient()
    if (!vodClient) {
      return ctx.badRequest("VOD client is not properly configured")
    }

    const params = {
      "RegionId": config.VOD_region,
      "VideoId": newCurrentLecture.video.video_id
    }
    const requestOption = {
      method: 'POST'
    }
    let result
    try {
      result = await vodClient.request('GetVideoPlayAuth', params, requestOption)
    } catch(err) {
      console.log(err)
      return ctx.internalServerError("Error on GetVideoPlayAuth")
    }
    // Update current lecture
    await strapi.entityService.update(
      "plugin::masterclass.mc-student-course",
      student.id,
      {
        data: {
          current_lecture: lecture
        }
      }
    )
    return {
      PlayAuth: result.PlayAuth,
      VideoId: newCurrentLecture.video.video_id,
      classesCompleted: student.lectures_seen,
      currentLecture: lecture
    }
  },
  async checkLecture(ctx) {
    const { user } = ctx.state
    const { id } = ctx.params
    const { lecture } = ctx.query

    const student = await strapi.db.query(
      "plugin::masterclass.mc-student-course"
    ).findOne(
      {
        where: {
          student: user.id,
          course: id
        },
        populate: {
          course: {
            populate: {
              lectures: {
                fields: ["id"]
              }
            }
          },
          lectures_seen: {
            fields: ["id"]
          },
          current_lecture: {
            fields: ["id"]
          }
        }
      }
    )
    if (!student) {
      return ctx.badRequest("No access to this course")
    }
    const currentLectureIndex = student.course.lectures.findIndex(
      l => l.id.toString() === lecture
    )
    if (currentLectureIndex < 0 ) {
      return ctx.badRequest("The lecture does not exist or does not belong to this course")
    }

    let updateCurrentLecture = true
    let classesCompleted = student.lectures_seen
    if (!classesCompleted || !classesCompleted.length) {
      classesCompleted = [lecture]
    } else {
      // Check whether the lecture is already marked as completed
      // if so, remove it from the list
      const idx = classesCompleted.findIndex(l => l.id.toString() === lecture)
      if (idx < 0) {
        // The lecture is being marked as seen
        classesCompleted.push(lecture)
      } else {
        // The lecture is being unmarked as seen
        const firstHalf = classesCompleted.slice(0, idx)
        const secondHalf = classesCompleted.slice(idx + 1)
        classesCompleted = firstHalf.concat(secondHalf)
        // Don't update the current lecture
        updateCurrentLecture = false
      }
    }

    // Set as current lecture the lecture that follows the one just marked as seen
    let newCurrentLecture = student.current_lecture
    if (updateCurrentLecture) {
      if (currentLectureIndex !== student.course.lectures.length - 1) {
        // not the last lecture
        newCurrentLecture = student.course.lectures[currentLectureIndex + 1]
      } else {
        // is the last lecture
        newCurrentLecture = student.course.lectures[currentLectureIndex]
      }
    }

    // Update student
    await strapi.entityService.update(
      "plugin::masterclass.mc-student-course",
      student.id,
      {
        data: {
          currentLecture: newCurrentLecture.id,
          lectures_seen: classesCompleted
        }
      }
    )
    return {
      ok: true
    }
  },
  // this handler only returns the IDs of all the courses purchased by the user
  async getItemsPurchased(ctx) {
    const { user } = ctx.state
    if (!user) {
      return ctx.badRequest("There must be an user")
    }
    const courses = await strapi.entityService.findMany("plugin::masterclass.mc-student-course", {
      filters: {
        student: user.id
      },
      populate: {
        course: {
          fields: ["id"]
        }
      }
    })
    ctx.body = { courses }
  },
  // this handler returns the full information of all the courses purchased by the user
  async getMyLearning(ctx) {
    const { user } = ctx.state
    if (!user) {
      return ctx.badRequest("There must be an user")
    }
    const courses = await strapi.entityService.findMany("plugin::masterclass.mc-student-course", {
      filters: {
        student: user.id
      },
      populate: {
        course: {
          fields: [
            "id",
            "duration",
            "title",
            "description",
            "price",
            "slug"
          ],
          populate: {
            thumbnail: {
              fields: ["name", "url"]
            },
            lectures: {
              fields: ["title"],
              populate: {
                video: {
                  fields: ["duration"]
                }
              }
            }
          }
        }
      }
    })
    ctx.body = { courses }
  }
}
