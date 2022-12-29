'use strict';

const { courseQuery } = require("./categories")

/**
 * Given a dollar amount number, convert it to it's value in cents
 * @param number 
 */
const fromDecimalToInt = (number) => parseInt(number * 100)

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

    const { courses, method } = ctx.request.body
    if (!courses || !courses.length) {
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
        label: course.title,
        quantity: 1
      })
    }

    const payment_method = method === "cc" ? "credit_card" : "paypal"

    const params = {
      user,
      payment_method,
      payload: {courses_ids: courses},
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

    const params = {
      user,
      checkout_session
    }

    let order

    try {
      const result = await strapi.service("plugin::payments.orders").confirm(params)
      if (result.error) {
        return ctx[result.status](result.msg)
      }
      order = result
    } catch(err) {
      console.log(err)
      return ctx.internalServerError("Something went wrong")
    }

    if (!order.confirmed) {
      return ctx.badRequest("Could not confirm payment")
    }

    const { courses_ids } = order.payload

    let courses = []

    if (courses_ids && courses_ids.length > 0) {
      courses = await strapi.entityService.findMany("plugin::masterclass.mc-course", {
        filters: {
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

    // Sign in user to the courses purchased.
    if (courses.length > 0) {
      await strapi.service('plugin::masterclass.courses')
        .signIntoMultipleCourses(user, courses)
    }

    order.courses = courses

    ctx.body = { order }
  }
}
