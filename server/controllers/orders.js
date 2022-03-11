'use strict';

const axios = require("axios")

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
    const BASE_URL = ctx.request.headers.origin || 'http://localhost:3000' //

    const { courses, method } = ctx.request.body
    if(!courses || !courses.length) {
      return ctx.badRequest("No courses received")
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

    let checkout_session
    let total = 0
    let data

    if (method === "cc") {
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

      try {
        const result = await axios.post(url, {
          auth: paypalAuth,
          headers: {
            "Content-Type": "application/json"
          },
          body: reqBody
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
        checkout_session,
        courses
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

    const order = await strapi.db.query("plugin::masterclass.mc-order").findOne({
      where: { checkout_session },
      populate: {
        user: {
          fields: ["id"]
        },
        courses: {
          fields: ["id"]
        }
      }
    })

    if (!order) {
      return ctx.notFound("Order not found")
    }
    if (order.user.id !== user.id) {
      return ctx.forbidden("This order does not belong to this user")
    }

    if (session.payment_status === "paid") {
      // Sign in user to the courses if the order was not confirmed.
      if (!order.confirmed) {
        await strapi.service('plugin::masterclass.courses')
          .signIntoMultipleCourses(user, order.courses)

        // Mark order as confirmed
        order.confirmed = true
        await strapi.entityService.update("plugin::masterclass.mc-order", order.id, {
          data: {
            confirmed: true
          }
        })
      }
      ctx.body = { order }
    } else {
      return ctx.badRequest("Order not verified")
    }
  },
  async executePayment(ctx) {
    const { user } = ctx.state
    if (!user) {
      return ctx.badRequest("User must be authenticated")
    }
    const { token } = ctx.request.body
    if (!token) {
      return ctx.badRequest("Empty token")
    }

    const order = await strapi.db.query("plugin::masterclass.mc-order").findOne({
      where: { checkout_session: token },
      populate: {
        user: {
          fields: ["id"]
        },
        courses: {
          fields: ["id"]
        }
      }
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

    const paypalAuth = await strapi.service("plugin::masterclass.paypal").getPaypalAuth()
    const config = await strapi.service("plugin::masterclass.paypal").getConfig()
    if (!paypalAuth) {
      console.log("PayPal is not properly configured")
      console.log({config})
      return ctx.badRequest("PayPal is not properly configured")
    }

    let data

    const url = `${PAYPAL_API}/v2/checkout/orders/${token}/capture`
    try {
      const result = await axios.post(url, {
        auth: paypalAuth,
        headers: {
          "Content-Type": "application/json"
        },
        body: {}
      })
      data = result.data
    } catch(err) {
      console.log(err)
      return ctx.internalServerError("Error while confirming paypal order")
    }

    if (data.status === "COMPLETED") {
      await strapi.service('plugin::masterclass.courses')
        .signIntoMultipleCourses(user, order.courses)

      // Mark order as confirmed
      order.confirmed = true
      await strapi.entityService.update("plugin::masterclass.mc-order", order.id, {
        data: {
          confirmed: true
        }
      })
    }

    ctx.body = { order }    
  }
}