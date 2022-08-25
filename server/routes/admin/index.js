'use strict';

module.exports = {
  type: "admin",
  routes: [
    {
      method: 'GET',
      path: '/courses',
      handler: 'admin__courses.find',
      config: {
        policies: [],
      }
    },
    {
      method: 'POST',
      path: '/courses',
      handler: 'admin__courses.create',
      config: {
        policies: [],
      }
    },
    {
      method: 'PUT',
      path: '/courses/:id',
      handler: 'admin__courses.update',
      config: {
        policies: [],
      }
    },
    {
      method: 'PUT',
      path: '/course/:id/link-lectures',
      handler: 'admin__courses.linkLectures',
      config: {
        policies: [],
      }
    },
    {
      method: 'POST',
      path: '/get-video-list',
      handler: 'admin__lectures.getVideoList',
      config: {
        policies: [],
      }
    },
    {
      method: 'POST',
      path: '/lectures',
      handler: 'admin__lectures.create',
      config: {
        policies: [],
      }
    },
    {
      method: 'GET',
      path: '/lectures',
      handler: 'admin__lectures.find',
      config: {
        policies: [],
      }
    },
    {
      method: 'PUT',
      path: '/lectures/:id',
      handler: 'admin__lectures.update',
      config: {
        policies: [],
      }
    },
    {
      method: 'GET',
      path: '/list-categories',
      handler: 'admin__categories.listCategories',
      config: {
        policies: [],
      }
    },
    {
      method: 'GET',
      path: '/list-videos',
      handler: 'admin__videos.find',
      config: {
        policies: [],
      }
    },
    {
      method: 'GET',
      path: '/list-courses',
      handler: 'admin__courses.listCourses',
      config: {
        policies: [],
      }
    },
    {
      method: 'GET',
      path: '/list-lectures',
      handler: 'admin__lectures.listLectures',
      config: {
        policies: [],
      }
    },
    {
      method: 'GET',
      path: '/config',
      handler: 'admin__upload.getConfig',
      config: {
        policies: [],
      }
    },
    {
      method: 'POST',
      path: '/config',
      handler: 'admin__upload.setConfig',
      config: {
        policies: [],
      }
    }
  ]
}