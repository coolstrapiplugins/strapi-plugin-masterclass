const course = require("./mc-course/schema.json")
const lecture = require("./mc-lecture/schema.json")
const student = require("./mc-student/schema.json")
const studentCourse = require("./mc-student-course/schema.json")
const video = require("./mc-video/schema.json")
const order = require("./mc-order/schema.json")

module.exports = {
  "mc-course": {schema: course},
  "mc-lecture": {schema: lecture},
  "mc-student": {schema: student},
  "mc-video": {schema: video},
  "mc-student-course": {schema: studentCourse},
  "mc-order": {schema: order}
}
