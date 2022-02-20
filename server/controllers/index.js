'use strict';

const admin__lectures = require('./admin__lectures');
const admin__courses = require('./admin__courses');
const admin__upload = require('./admin__upload');
const admin__stripe = require('./admin__stripe');
const categories = require("./categories");
const courses = require("./courses");
const orders = require("./orders");
const uploads = require("./uploads");

module.exports = {
  admin__lectures,
  admin__courses,
  admin__upload,
  admin__stripe,
  categories,
  courses,
  orders,
  uploads
};
