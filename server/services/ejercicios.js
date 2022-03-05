'use strict';

module.exports = ({ strapi }) => ({
  async assignEjercicios(user, ejercicios) {
    let student = await strapi.db.query("plugin::masterclass.mc-student").findOne({
      where: {user: user.id},
      populate: {
        ejercicios: {
          select: ["id"]
        }
      }
    })
    if (!student) {
      student = await strapi.entityService.create("plugin::masterclass.mc-student", {
        data: {
          user: user.id,
          ejercicios: ejercicios.map(e => e.id)
        }
      })
    } else {
      await strapi.entityService.update("plugin::masterclass.mc-student", student.id, {
        data: {
          ejercicios: [
            ...student.ejercicios.map(e => e.id),
            ...ejercicios.map(e => e.id)
          ]
        }
      })
    }
  }
})
