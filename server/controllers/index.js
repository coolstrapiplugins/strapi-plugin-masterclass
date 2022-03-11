'use strict';

const admin__ejercicios = require('./admin__ejercicios');
const admin__lectures = require('./admin__lectures');
const admin__courses = require('./admin__courses');
const admin__upload = require('./admin__upload');
const admin__stripe = require('./admin__stripe');
const admin__paypal = require('./admin__paypal');
const categories = require("./categories");
const ejercicios = require("./ejercicios");
const courses = require("./courses");
const orders = require("./orders");
const uploads = require("./uploads");

module.exports = {
  admin__ejercicios,
  admin__lectures,
  admin__courses,
  admin__upload,
  admin__stripe,
  admin__paypal,
  categories,
  courses,
  orders,
  uploads,
  ejercicios
};
