'use strict';

module.exports = {
  type: "content-api",
  routes: [
    {
      method: 'GET',
      path: '/courses',
      handler: 'courses.find',
      config: {
        policies: [],
      }
    },
    {
      method: 'GET',
      path: '/courses/:slug',
      handler: 'courses.findOne',
      config: {
        policies: [],
      }
    },
    {
      method: 'GET',
      path: '/course-details/:id',
      handler: 'courses.getCourseDetails',
      config: {
        policies: [],
      }
    },
    {
      method: 'GET',
      path: '/courses/:id/lectures-seen',
      handler: 'courses.getClassesCompleted',
      config: {
        policies: [],
      }
    },
    {
      method: 'GET',
      path: '/courses/:id/resume-course',
      handler: 'courses.resumeCourse',
      config: {
        policies: [],
      }
    },
    {
      method: 'GET',
      path: '/courses/:id/playLecture',
      handler: 'courses.getPlayAuth',
      config: {
        policies: [],
      }
    },
    {
      method: 'POST',
      path: '/courses/:id/check-lecture',
      handler: 'courses.checkLecture',
      config: {
        policies: [],
      }
    },
    {
      method: 'GET',
      path: '/orders',
      handler: 'orders.find',
      config: {
        policies: [],
      }
    },
    {
      method: 'GET',
      path: '/orders/:id',
      handler: 'orders.findOne',
      config: {
        policies: [],
      }
    },
    {
      method: 'POST',
      path: '/orders',
      handler: 'orders.create',
      config: {
        policies: [],
      }
    },
    {
      method: 'PUT',
      path: '/orders/:id',
      handler: 'orders.confirm',
      config: {
        policies: [],
      }
    },
    {
      method: 'GET',
      path: '/courses/my-learning',
      handler: 'courses.getCoursesPurchased',
      config: {
        policies: [],
      }
    }
  ]
}
