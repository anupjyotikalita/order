import {
  Order,
  Dish,
  DishType
} from "./Models"

const resolvers = {
  Query: {
    orders(_, args) {
      return Order.find(args)
    },
    dishes(_, args) {
      return Dish.find(args)
    },
    dishTypes(_, args) {
      return DishType.find(args)
    }
  },
  Mutation: {
    addOrder(_, args) {
      return Order.create(args)
    },
    addDish(_, args) {
      return Dish.create(args)
    },
    updateDish(_, args) {
      const id = args._id
      delete args._id
      return new Promise((resolve, reject) => {
        Dish.updateOne({
          _id: id
        }, args).then(r => {
          Dish.findOne({
            _id: id
          }).then(resolve).catch(reject)
        }).catch(reject)
      })
    },
    removeDish(_, args) {
      return new Promise((res, rej) => {
        Order.find({
          "dishes.id": args._id
        }).then(result => {
          result.forEach(o => {
            Order.updateOne({
                _id: o._id
              }, {
                $set: {
                  dishes: o.dishes.filter(d => d.id != args._id)
                }
              })
              .then(console.info)
              .catch(console.error)
          })

          Dish.findOneAndDelete({
            _id: args._id
          }).then(res).catch(rej)
        })
      })
    },
    addDishType(_, args) {
      return DishType.create(args)
    },
    updateDishType(_, args) {
      const id = args._id
      delete args._id
      return new Promise((resolve, reject) => {
        DishType.updateOne({
            _id: id
          }, {
            name: args.name
          })
          .then(r => {
            DishType.findOne({
                _id: id
              })
              .then(resolve)
              .catch(reject)
          }).catch(reject)
      })
    },
    removeDishType(_, args) {
      return new Promise((res, rej) => {
        Dish.find({
          type: args._id
        }).then(r => {
          if (r.length > 0) {
            rej("Some dishes with this dish type still exist. Remove those dishes first, before removing the dish type.")
            return
          }

          DishType.findOneAndDelete({
            _id: args._id
          }).then(res).catch(rej)
        }).catch(rej)
      })
    },
    updateOrder(_, args) {
      const id = args._id
      delete args._id
      return new Promise((resolve, reject) => {
        if (args.dishes) {
          args.hasPayed = args.dishes.length === 0 ? (!args.name && !args.table && !args.notes ? true : false) : args.dishes.every(d => d.hasPayed)
        }

        Order.updateOne({
          _id: id
        }, args).then(r => {
          Order.findOne({
              _id: id
            })
            .then(resolve)
            .catch(reject) //TODO: Rollback here!!
        }).catch(reject)
      })
    },
    joinOrders(_, args) {
      const id = args._id
      delete args._id
      const allIds = args.orderIds.concat([id]);
      return new Promise((resolve, reject) => {
        Order.find({
          _id: {
            $in: allIds
          }
        }).then(r => {
          Order.updateOne({
            _id: id
          }, {
            dishes: [].concat.apply([], r.map(m => m.dishes))
          }).then(r => {
            Order.deleteOne({
              _id: {
                $in: args.orderIds
              }
            }).then(r => {
              Order.findOne({
                _id: id
              }).then(resolve).catch(reject) //TODO: Rollback here!!
            }).catch(reject)
          }).catch(reject)
        }).catch(reject)
      })
    }
  },
  Dish: {
    type(dish) {
      return DishType.findOne({
        _id: dish.type
      })
    },
  },
  OrderDish: {
    dish(orderDish) {
      return Dish.findOne({
        _id: orderDish.id
      })
    },
  },
  Order: {
    dishes(order) {
      return order.dishes
    }
  }
};

export default resolvers;