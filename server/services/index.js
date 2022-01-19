'use strict';

const upload = require('./upload');
const courses = require('./courses');
const stripe = require('./stripe');

module.exports = {
  upload,
  courses,
  stripe
};
