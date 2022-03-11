'use strict';

const upload = require('./upload');
const courses = require('./courses');
const ejercicios = require('./ejercicios');
const lectures = require('./lectures');
const stripe = require('./stripe');
const paypal = require('./paypal');

module.exports = {
  upload,
  courses,
  ejercicios,
  stripe,
  paypal,
  lectures
};
