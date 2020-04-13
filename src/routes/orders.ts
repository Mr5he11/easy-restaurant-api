import { Router } from 'express'
import * as ordersController from '../controllers/order'
import * as itemsController from '../controllers/item'

const orders = Router({mergeParams: true});

orders.route('/')
  .get(ordersController.get)
  .post(ordersController.create)

orders.route('/:orderId')
  .get(ordersController.get)
  .put(ordersController.update)
  .delete(ordersController.remove)

orders.route('/:orderId/items')
  .post(itemsController.addToOrder)

orders.route('/:orderId/items/:itemId')
  .delete(itemsController.removeFromOrder)
  .post(itemsController.startPreparation)
  .put(itemsController.endPreparation)

export default orders