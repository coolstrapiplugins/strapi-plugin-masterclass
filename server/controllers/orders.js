'use strict';

const axios = require("axios")

const orderQuery = {
  populate: {
    user: {
      fields: ["id"]
    },
    courses: {
      fields: [
        "id",
        "duration",
        "title",
        "description",
        "long_description",
        "price",
        "slug"
      ],
      populate: {
        thumbnail: {
          fields: ["name", "url"]
        },
        lectures: {
          fields: []
        },
        category: {
          fields: ["slug", "title", "id"]
        }
      }
    },
    ejercicios: {
      fields: [
        "id",
        "title",
        "description",
        "price",
        "slug"
      ],
      populate: {
        thumbnail: {
          fields: ["name", "url"]
        },
        category: {
          fields: ["slug", "title", "id"]
        }
      }
    }
  }
}

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
    const orders = await strapi.entityService.findMany("plugin::masterclass.mc-order", {
      filters: {
        user: user.id
      },
      populate: {
        courses: {
          fields: ["id", "title", "slug"]
        }
      },
      sort: {
        id: "desc"
      }
    })
    ctx.body = {
      orders
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
    const order = await strapi.entityService.findOne(
      "plugin::masterclass.mc-order",
      id,
      {
        populate: {
          user: {
            fields: ["id"]
          },
          courses: {
            fields: ["id", "title", "slug"]
          }
        }
      }
    )
    if (order && (order.user.id !== user.id)) {
      return ctx.forbidden("This order does not belong to this user")
    }
    ctx.body = {
      order
    }
  },
  async create(ctx) {
    const { user } = ctx.state
    if (!user) {
      return ctx.badRequest("User must be authenticated")
    }
    // Get request origin to redirect back after checkout
    const BASE_URL = ctx.request.headers.origin || 'http://localhost:3000'

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
    let payment_method

    if (method === "cc") {
      payment_method = "credit_card"
      // Pay with credit card: create order with Stripe
      const stripe = await strapi.service("plugin::masterclass.stripe").getStripeClient()
      if (!stripe) {
        return ctx.badRequest("Stripe Private key is unset")
      }
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: items.map(item => {
          total += item.price;
          return {
            price_data: {
              currency: "usd",
              product_data: {
                name: item.label
              },
              unit_amount: fromDecimalToInt(item.price),
            },
            quantity: 1,
          };
        }),
        customer_email: user.email,
        mode: "payment",
        success_url: `${BASE_URL}/payment?checkout_session={CHECKOUT_SESSION_ID}`,
        cancel_url: BASE_URL,
      })
      checkout_session = session.id
    } else {
      payment_method = "paypal"
      // Pay with PayPal: create order with PayPal
      const paypalAuth = await strapi.service("plugin::masterclass.paypal").getPaypalAuth()
      const config = await strapi.service("plugin::masterclass.paypal").getConfig()
      if (!paypalAuth) {
        console.log("PayPal is not properly configured")
        console.log({config})
        return ctx.badRequest("PayPal is not properly configured")
      }

      items.map(item => {
        total += item.price;
      })

      const reqBody = {
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'USD',
            value: total
          }
        }],
        application_context: {
          brand_name: `Tutor Universitario`,
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
          return_url: `${BASE_URL}/paypal-payment`, // Url despues de realizar el pago
          cancel_url: BASE_URL // Url despues de realizar el pago
        }
      }
      // https://api-m.sandbox.paypal.com/v2/checkout/orders [POST]

      const url = `${PAYPAL_API}/v2/checkout/orders`

      const user = `${paypalAuth.username}:${paypalAuth.password}`

      try {
        const result = await axios.post(url, reqBody, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Basic ${Buffer.from(user).toString("base64")}`
          }
        })
        data = result.data
        checkout_session = data.id
      } catch(err) {
        console.log(err)
        return ctx.internalServerError("Error while creating paypal order")
      }
    }

    // Create order
    await strapi.entityService.create("plugin::masterclass.mc-order", {
      data: {
        total,
        user: user.id,
        confirmed: false,
        payment_method,
        courses,
        ejercicios,
        checkout_session
      }
    })

    ctx.body = { id: checkout_session, ...data }
  },
  async confirm(ctx) {
    const { user } = ctx.state
    if (!user) {
      return ctx.badRequest("User must be authenticated")
    }
    const { checkout_session } = ctx.request.body

    const order = await strapi.db.query("plugin::masterclass.mc-order").findOne({
      where: { checkout_session },
      ...orderQuery
    })

    if (!order) {
      return ctx.notFound("Order not found")
    }
    if (order.user.id !== user.id) {
      return ctx.forbidden("This order does not belong to this user")
    }

    if (order.confirmed) {
      ctx.body = { order }
      return
    }

    if (order.payment_method === "credit_card") {
      let session

      const stripe = await strapi.service("plugin::masterclass.stripe").getStripeClient()
      if (!stripe) {
        return ctx.badRequest("Stripe Private key is unset")
      }
      try {
        session = await stripe.checkout.sessions.retrieve(checkout_session)
      } catch(err) {
        return ctx.notFound("Checkout ID " + checkout_session + " not found")
      }
      if (session.payment_status !== "paid") {
        return ctx.badRequest("Order not verified")
      }

      order.courses = await Promise.all(order.courses.map(async c => {
        c.kind = "course"
        c.category.slug = await strapi.service("plugin::masterclass.courses").buildAbsoluteSlug(c)
        return c
      }))
      order.ejercicios = await Promise.all(order.ejercicios.map(async e => {
        e.kind = "ejercicio"
        e.category.slug = await strapi.service("plugin::masterclass.courses").buildAbsoluteSlug(e)
        return e
      }))
    } else {
      // Capture paypal
      const paypalAuth = await strapi.service("plugin::masterclass.paypal").getPaypalAuth()
      const config = await strapi.service("plugin::masterclass.paypal").getConfig()
      if (!paypalAuth) {
        console.log("PayPal is not properly configured")
        console.log({config})
        return ctx.badRequest("PayPal is not properly configured")
      }

      let data

      let orderCaptured = false
      const url = `${PAYPAL_API}/v2/checkout/orders/${checkout_session}/capture`
      try {
        const user = `${paypalAuth.username}:${paypalAuth.password}`
        const result = await axios.post(url, {}, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Basic ${Buffer.from(user).toString("base64")}`
          }
        })
        orderCaptured = result.data.status === "COMPLETED"
      } catch(err) {
        if (err.response && err.response.data) {
          const { issue } = err.response.data.details[0]
          if (issue === "ORDER_ALREADY_CAPTURED") {
            orderCaptured = true
          } else {
            console.log("Error capturing payment:")
            console.log(JSON.stringify(err.response.data))
          }
        } else {
          console.log("Error capturing payment:")
          console.log(JSON.stringify(err.toJSON()))
        }
      }
      if (!orderCaptured) {
        return ctx.badRequest("Unable to verify payment")
      }
    }

    // Sign in user to the courses and assign ejercicios purchased.
    const { courses, ejercicios } = order
    if (courses.length > 0) {
      await strapi.service('plugin::masterclass.courses')
        .signIntoMultipleCourses(user, courses)
    }
    if (ejercicios.length > 0) {
      await strapi.service('plugin::masterclass.ejercicios')
        .assignEjercicios(user, ejercicios)
    }

    // Mark order as confirmed
    await strapi.entityService.update("plugin::masterclass.mc-order", order.id, {
      data: {
        confirmed: true
      }
    })
    order.confirmed = true
    ctx.body = { order }
  }
}
