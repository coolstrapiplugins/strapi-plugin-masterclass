const category = require("./mc-category/schema.json")
const course = require("./mc-course/schema.json")
const moduleSchema = require("./mc-module/schema.json")
const lecture = require("./mc-lecture/schema.json")
const student = require("./mc-student/schema.json")
const studentCourse = require("./mc-student-course/schema.json")
const video = require("./mc-video/schema.json")
const order = require("./mc-order/schema.json")
const ejercicio = require("./mc-ejercicio/schema.json")
const solucion = require("./mc-solucion/schema.json")

module.exports = {
  "mc-category": {schema: category},
  "mc-course": {schema: course},
  "mc-module": {schema: moduleSchema},
  "mc-lecture": {schema: lecture},
  "mc-student": {schema: student},
  "mc-video": {schema: video},
  "mc-student-course": {schema: studentCourse},
  "mc-order": {schema: order},
  "mc-ejercicio": {schema: ejercicio},
  "mc-solucion": {schema: solucion}
}
