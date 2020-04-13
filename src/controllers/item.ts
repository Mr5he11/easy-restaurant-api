import { Handler } from 'express'
import { Query } from 'mongoose'
import Item, { IItem } from '../models/item'
import Table, { ITable } from '../models/table';
import { IOrder } from '../models/order';

export const get: Handler = (req, res, next) => {
  let type: string = req.query.itemType ? req.query.itemType : undefined;
  let name: string = req.query.itemName ? req.query.itemName : undefined;
  let subtype: string = req.body.itemSubtype ? req.body.itemSubtype : undefined;
  // this one is a flag that, if true, makes the controller return a single object instead of an array
  let findOne: boolean = req.query.findOne || false;
  let query: Query<any> = Item.find({})
  if (type) {
    query = query.where('type').equals(type);
  }
  if (subtype) {
    query = query.where('subtype').equals(subtype);
  }
  if (name) {
    query = query.where('name').equals(name);
  }
  query
    .then(items => {
      if (findOne) {
        return res.status(200).json({ item: items[0] });
      }
      res.status(200).json({ items });
    })
    .catch(err => res.json({ statusCode: 500, error: true, errormessage: err }));
}

export const create: Handler = (req, res, next) => {
  Item.create({
    name: req.body.itemName,
    price: req.body.itemPrice,
    type: req.body.itemType
  }, (err: any, item: IItem) => {
    if (err) {
      return next({ statusCode: 500, error: true, errormessage: "DB Error" });
    } else {
      return res.status(200).json({ item });
    }
  });
}

export const update: Handler = (req, res, next) => {
  res.status(501).end();
}

export const remove: Handler = (req, res, next) => {
  Item.findOneAndDelete({ name: req.params.itemName })
    .then(item => res.status(200).json({ item }))
    .catch(err => res.json({ statusCode: 500, error: true, errormesage: err }));
}

export const addToOrder: Handler = (req, res, next) => {
  const item = req.body.item;
  const tableNumber = req.params.tableNumber;
  const orderId = req.params.orderId;
  Table.findOne({number: tableNumber}) 
    .then(table => {
      if (table && table.services && table.services.length > 0) {
        const lastServiceIndex = table.services.length - 1;
        const orderIndex = table.services[lastServiceIndex].orders.findIndex((order: IOrder) => `${order._id}` == orderId);
        table.services[lastServiceIndex].orders[orderIndex].items.push({
          item: item._id,
          quantity: item.quantity
        });
        table.save((err: any, table) => {
          if (err) {
            let msg = `DB error: ${err}`;
			      return next({ statusCode: 500, error: true, errormessage: msg });
          }
          table
            .populate('services.waiter')
            .populate('services.orders.items.item')
            .execPopulate()
            .then((table) => {
              return res.status(200).json({ table });
            })
            .catch(err => {
              if (err) {
                return next({ statusCode: 500, error: true, errormessage: "DB error on table population" });
              }
            });
        });
      } else {
        return next({ statusCode: 404, error: true, errormessage: "Table or order not found" });
      }
    });
}

export const removeFromOrder: Handler = (req, res, next) => {
  const itemId = req.params.itemId;
  const tableNumber = req.params.tableNumber;
  const orderId = req.params.orderId;
  Table.findOne({number: tableNumber}) 
    .then(table => {
      if (table && table.services && table.services.length > 0) {
        const lastServiceIndex = table.services.length - 1;
        const orderIndex = table.services[lastServiceIndex].orders.findIndex((order: IOrder) => `${order._id}` == orderId);
        const newItems = table.services[lastServiceIndex].orders[orderIndex].items.filter((item: any) => `${item.item}` != itemId);
        table.services[lastServiceIndex].orders[orderIndex].items = newItems;
        table.save((err, table: ITable) => {
          if (err) {
            let msg = `DB error: ${err}`;
			      return next({ statusCode: 500, error: true, errormessage: msg });
          }
          table
            .populate('services.waiter')
            .populate('services.orders.items.item')
            .execPopulate()
            .then((table) => {
              return res.status(200).json({ table });
            })
            .catch(err => {
              if (err) {
                return next({ statusCode: 500, error: true, errormessage: "DB error on table population" });
              }
            });
        });
      } else {
        return next({ statusCode: 404, error: true, errormessage: "Table or order not found" });
      }
    });
}

export const startPreparation: Handler = (req, res, next) => {
  const tableNumber = req.params.tableNumber;
  const orderId = req.params.orderId;
  const itemId = req.params.itemId;
  const start = req.body.time;
  Table.findOne({number: tableNumber}) 
    .then(table => {
      if (table && table.services && table.services.length > 0) {
        const lastServiceIndex = table.services.length - 1;
        const orderIndex = table.services[lastServiceIndex].orders.findIndex((order: IOrder) => `${order._id}` == orderId);
        const itemIndex = table.services[lastServiceIndex].orders[orderIndex].items.findIndex((item: any) => `${item._id}` == itemId);
        table.services[lastServiceIndex].orders[orderIndex].items[itemIndex].start = start;
        table.save((err: any, table) => {
          if (err) {
            let msg = `DB error: ${err}`;
			      return next({ statusCode: 500, error: true, errormessage: msg });
          }
          return res.status(200).json({ start });
        });
      } else {
        return next({ statusCode: 404, error: true, errormessage: "Table or order not found" });
      }
    });
}

export const endPreparation: Handler = (req, res, next) => {
  const tableNumber = req.params.tableNumber;
  const orderId = req.params.orderId;
  const user = req.user;
  console.log(user);
  const itemId = req.params.itemId;
  const end = req.body.time;
  Table.findOne({number: tableNumber}) 
    .then(table => {
      if (table && table.services && table.services.length > 0) {
        const lastServiceIndex = table.services.length - 1;
        const orderIndex = table.services[lastServiceIndex].orders.findIndex((order: IOrder) => `${order._id}` == orderId);
        const itemIndex = table.services[lastServiceIndex].orders[orderIndex].items.findIndex((item: any) => `${item._id}` == itemId);
        table.services[lastServiceIndex].orders[orderIndex].items[itemIndex].end = end;
        table.services[lastServiceIndex].orders[orderIndex].items[itemIndex].cook = user.id;
        table.save((err: any, table) => {
          if (err) {
            let msg = `DB error: ${err}`;
			      return next({ statusCode: 500, error: true, errormessage: msg });
          }
          return res.status(200).json({ end });
        });
      } else {
        return next({ statusCode: 404, error: true, errormessage: "Table or order not found" });
      }
    });
}