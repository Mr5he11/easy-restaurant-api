import { Router } from 'express'
import * as controller from '../controllers/table'
import ordersRoutes from './orders'

const tables = Router();

tables.route('/')
  .get(controller.get)
  .post(controller.create)

tables.route('/validate')
  .get(controller.findOneForValidation)

tables.route('/:tableNumber')
  .get(controller.get)
  .put(controller.update)
  .patch(controller.free)
  .delete(controller.remove)

tables.get('/:tableNumber/bill', controller.getBill)

tables.use('/:tableNumber/orders', ordersRoutes)

export default tables