'use strict';

const axios = require("axios")
const { courseQuery, ejercicioQuery } = require("./categories")

/**
 * Given a dollar amount number, convert it to it's value in cents
 * @param number 
 */
const fromDecimalToInt = (number) => parseInt(number * 100)

const PAYPAL_API = 'https://api-m.sandbox.paypal.com'; // Live https://api-m.paypal.com

module.exports = {
  async find(ctx) {
    const { user } = ctx.state
    if (!user) {
      return ctx.badRequest("User must be authenticated")
    }

    let result

    try {
      result = await strapi.service("plugin::payments.orders").find(user)
      if (result.error) {
        return ctx[result.status](result.msg)
      }
    } catch(err) {
      console.log(JSON.stringify(err))
      return ctx.internalServerError("Something went wrong")
    }

    ctx.body = {
      orders: result
    }
  },
  /**
   * Retrieve an order by id, only if it belongs to the user
   */
  async findOne(ctx) {
    const { id } = ctx.params;
    const { user } = ctx.state
    if (!user) {
      return ctx.badRequest("User must be authenticated")
    }

    let result

    try {
      result = await strapi.service("plugin::payments.orders").findOne(user, id)
      if (result.error) {
        return ctx[result.status](result.msg)
      }
    } catch(err) {
      console.log(JSON.stringify(err))
      return ctx.internalServerError("Something went wrong")
    }

    ctx.body = {
      order: result
    }
  },
  async create(ctx) {
    const { user } = ctx.state
    if (!user) {
      return ctx.badRequest("User must be authenticated")
    }

    const { courses, ejercicios, method } = ctx.request.body
    if ((!courses || !courses.length) && (!ejercicios || !ejercicios.length)) {
      return ctx.badRequest("No items received")
    }

    const items = []
    // Get courses details
    for (let i = 0; i < courses.length; i++) {
      const id = courses[i]
      const course = await strapi.entityService.findOne("plugin::masterclass.mc-course", id, {
        fields: ["title", "price"]
      })
      if (!course) {
        return ctx.badRequest("Course " + id + " not found")
      }
      items.push({
        price: course.price,
        label: course.title
      })
    }
    // Get ejercicios details
    for (let i = 0; i < ejercicios.length; i++) {
      const id = ejercicios[i]
      const ejercicio = await strapi.entityService.findOne("plugin::masterclass.mc-ejercicio", id, {
        fields: ["title", "price"],
        populate: {
          category: {
            fields: ["title"]
          }
        }
      })
      if (!ejercicio) {
        return ctx.badRequest("Course " + id + " not found")
      }
      let label = ejercicio.title
      if (ejercicio.category) {
        label = `${ejercicio.category.title} - ${ejercicio.title}`
      }
      items.push({
        price: ejercicio.price,
        label
      })
    }

    let checkout_session
    let total = 0
    let data
    const payment_method = method === "cc" ? "credit_card" : "paypal"

    // Get request origin to redirect back after checkout
    const BASE_URL = ctx.request.headers.origin || 'http://localhost:3000'

    const params = {
      user,
      requestOrigin: BASE_URL,
      payment_method,
      payload: {courses_ids: courses, ejercicios_ids: ejercicios},
      items
    }

    let result

    try {
      result = await strapi.service("plugin::payments.orders").create(params)
      if (result.error) {
        return ctx[result.status](result.msg)
      }
    } catch(err) {
      console.log(JSON.stringify(err))
      return ctx.internalServerError("Something went wrong")
    }

    ctx.body = result
  },
  async confirm(ctx) {
    const { user } = ctx.state
    if (!user) {
      return ctx.badRequest("User must be authenticated")
    }
    const { checkout_session } = ctx.request.body

    let order

    try {
      const result = await strapi.service("plugin::payments.orders").create(params)
      if (result.error) {
        return ctx[result.status](result.msg)
      }
      order = result
    } catch(err) {
      console.log(JSON.stringify(err))
      return ctx.internalServerError("Something went wrong")
    }

    if (!order.confirmed) {
      return ctx.badRequest("Could not confirm payment")
    }

    const { courses_ids, ejercicios_ids } = order.payload

    let courses = []
    let ejercicios = []

    if (courses_ids) {
      courses = await strapi.entityService("plugin::masterclass.courses").findMany({
        where: {
          id: courses_ids
        },
        ...courseQuery
      })
      courses = await Promise.all(courses.map(async c => {
        c.kind = "course"
        c.category.slug = await strapi.service("plugin::masterclass.courses").buildAbsoluteSlug(c)
        return c
      }))
    }
    if (ejercicios_ids) {
      ejercicios = await strapi.entityService("plugin::masterclass.ejercicios").findMany({
        where: {
          id: ejercicios_ids
        },
        ...ejercicioQuery
      })
      ejercicios = await Promise.all(ejercicios.map(async e => {
        e.kind = "ejercicio"
        e.category.slug = await strapi.service("plugin::masterclass.courses").buildAbsoluteSlug(e)
        return e
      }))
    }

    // Sign in user to the courses and assign ejercicios purchased.
    if (courses.length > 0) {
      await strapi.service('plugin::masterclass.courses')
        .signIntoMultipleCourses(user, courses)
    }
    if (ejercicios.length > 0) {
      await strapi.service('plugin::masterclass.ejercicios')
        .assignEjercicios(user, ejercicios)
    }

    order.courses = courses
    order.ejercicios = ejercicios

    ctx.body = { order }
  }
}
