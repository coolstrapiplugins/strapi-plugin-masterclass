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
      path: '/upload',
      handler: 'admin__lectures.upload',
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
    },
    {
      method: 'GET',
      path: '/stripe-pk',
      handler: 'admin__stripe.getStripePk',
      config: {
        policies: [],
      }
    },
    {
      method: 'POST',
      path: '/stripe-pk',
      handler: 'admin__stripe.setStripePk',
      config: {
        policies: [],
      }
    }
  ]
}