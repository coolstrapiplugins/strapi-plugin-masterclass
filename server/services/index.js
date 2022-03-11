'use strict';

const upload = require('./upload');
const courses = require('./courses');
const lectures = require('./lectures');
const stripe = require('./stripe');
const paypal = require('./paypal');

module.exports = {
  upload,
  courses,
  stripe,
  paypal,
  lectures
};
