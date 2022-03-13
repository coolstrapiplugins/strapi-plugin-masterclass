'use strict';

module.exports = ({ strapi }) => ({
  async assignEjercicios(user, ejercicios) {
    const student = await strapi.db.query("plugin::masterclass.mc-student").findOne({
      where: {user: user.id},
      populate: {
        ejercicios: {
          select: ["id"]
        }
      }
    })
    if (!student) {
      await strapi.entityService.create("plugin::masterclass.mc-student", {
        data: {
          user: user.id,
          ejercicios: ejercicios.map(e => e.id)
        }
      })
    } else {
      const newEjercicios = ejercicios.filter(e => {
        const alreadyAssigned = student.ejercicios.some(({id}) => id === e.id)
        return !alreadyAssigned
      })
      await strapi.entityService.update("plugin::masterclass.mc-student", student.id, {
        data: {
          ejercicios: [
            ...student.ejercicios.map(e => e.id),
            ...newEjercicios.map(e => e.id)
          ]
        }
      })
    }
  }
})
