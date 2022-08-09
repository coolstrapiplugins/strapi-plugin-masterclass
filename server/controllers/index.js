'use strict';

const admin__ejercicios = require('./admin__ejercicios');
const admin__lectures = require('./admin__lectures');
const admin__categories = require('./admin__categories');
const admin__courses = require('./admin__courses');
const admin__upload = require('./admin__upload');
const admin__videos = require('./admin__videos');
const categories = require("./categories");
const ejercicios = require("./ejercicios");
const courses = require("./courses");
const uploads = require("./uploads");

module.exports = {
  admin__ejercicios,
  admin__categories,
  admin__lectures,
  admin__courses,
  admin__upload,
  admin__videos,
  categories,
  courses,
  uploads,
  ejercicios
};
