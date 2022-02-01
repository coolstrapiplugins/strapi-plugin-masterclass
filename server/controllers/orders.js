'use strict';

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

    const { courses } = ctx.request.body
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

    const stripe = await strapi.service("plugin::masterclass.stripe").getStripeClient()
    if (!stripe) {
      return ctx.badRequest("Stripe Private key is unset")
    }
    let total = 0;
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

    // Create order
    await strapi.entityService.create("plugin::masterclass.mc-order", {
      data: {
        total,
        user: user.id,
        confirmed: false,
        checkout_session: session.id,
        courses
      }
    })

    ctx.body = { id: session.id }
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
  }
}