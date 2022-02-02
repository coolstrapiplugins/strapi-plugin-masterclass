'use strict';

const upload = require('./upload');
const courses = require('./courses');
const lectures = require('./lectures');
const stripe = require('./stripe');

module.exports = {
  upload,
  courses,
  stripe,
  lectures
};
