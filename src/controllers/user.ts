import { Handler } from 'express'
import User, { Roles, IUser } from '../models/user'
import Table from '../models/table'
import { IOrder } from '../models/order'

export const getAll: Handler = (req, res, next) => {
  User.find(req.query, { password: false })
    .then(users => res.status(200).json({ users }))
    .catch(err => next({ statusCode: 404, error: true, errormessage: `DB error: ${err}` }))
}

export const get: Handler = (req, res, next) => {
  if (!req.params.username)
    return next({ statusCode: 400, error: true, errormessage: `Must specify a Username` });

  User.findOne({ username: req.params.username }, { password: false })
    .then(user => {
      if (user) {
        const response: any = { user };
        Table.find()
          .then(tables => {
            // retrieve all services
            const servicesArray = tables.map(table => table.services);
            let services: any[] = [];
            servicesArray.forEach(srv => {
              srv.forEach(s => services.push(s));
            });
            if (user.role === Roles.Cook || user.role === Roles.Bartender) {
              // retrieve all orders
              const orders: IOrder[] = [];
              services.forEach(service => {
                service.orders.forEach((order: IOrder) => orders.push(order));
              });
              const items: any[] = []
              orders.forEach(order => {
                order.items.forEach(item => items.push(item));
              });
              const itemsPrepared = items.filter(item => { return `${item.cook}` === `${user._id}`; });
              let daysOfService = itemsPrepared.map(item => new Date(item.end).toDateString());
              daysOfService = Array.from(new Set(daysOfService));
              response.richInfo = {
                itemsPrepared: itemsPrepared,
                itemsTotalsAmount: items.length,
                itemsPreparedAmount: itemsPrepared.length,
                daysOfService: daysOfService
              }
            }
            if (user.role === Roles.Waiter) {
              let peopleServedAmount = 0;
              const servicesServed = services.filter(service => { return `${service.waiter}` === `${user._id}`; });
              let daysOfService = servicesServed.map(service => new Date(service.timestamp).toDateString());
              daysOfService = Array.from(new Set(daysOfService));
              servicesServed.forEach(service => { peopleServedAmount += service.covers });
              response.richInfo = {
                servicesServed: servicesServed,
                servicesTotalsAmount: services.length,
                servicesServedAmount: servicesServed.length,
                peopleServedAmount: peopleServedAmount,
                daysOfService: daysOfService
              }
            }
            res.status(200).json(response);
          });
      }
    })
    .catch(err => next({ statusCode: 404, error: true, errormessage: `DB error: ${err}` }))
}

export const create: Handler = (req, res, next) => {
  if (!req.body.username)
    next({ statusCode: 404, error: true, errormessage: "Username field missing" });
  else if (!req.body.password)
    next({ statusCode: 404, error: true, errormessage: "Password field missing" });
  else if (!req.body.role || !Object.values(Roles).includes(req.body.role))
    next({ statusCode: 404, error: true, errormessage: "Role not valid" });
  else
    User.create(req.body)
      .then(user => res.status(200).json({ user }))
      .catch(err => {
        let msg = `DB error: ${err.errmsg}`
        if (err.code === 11000)
          msg = "User already exists"
        next({ statusCode: 409, error: true, errormessage: msg });
      });
}

export const update: Handler = (req, res, next) => {
  if (!req.params.username)
    return next({ statusCode: 400, error: true, errormessage: `Must specify a Username` });

  User.findOneAndUpdate({ username: req.params.username }, req.body)
    .then(user => res.status(200).json({ user }))
    .catch(err => next({ statusCode: 400, error: true, errormessage: `DB error: ${err.errmsg}` }));
}

export const updatePartial: Handler = (req, res, next) => {
  User.findOneAndUpdate({ username: req.params.username }, { $set: req.body }, { new: true })
    .then(user => res.status(200).json({ user }))
    .catch(err => next({ statusCode: 400, error: true, errormessage: `DB error: ${err.errmsg}` }));
}

export const remove: Handler = (req, res, next) => {
  if (!req.params.username)
    return next({ statusCode: 400, error: true, errormessage: `Must specify a Username` });

  if (req.user.username == req.params.username)
    return next({ statusCode: 400, error: true, errormessage: `You can't delete your own user!` });

  User.findOneAndDelete({ username: req.params.username })
    .then(data => res.status(200).json({ error: false, errormessage: "", result: "User deleted successfully" }))
    .catch(err => next({ statusCode: 400, error: true, errormessage: `DB error: ${err.errmsg}` }))
}