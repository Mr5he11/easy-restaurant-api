import { Handler } from 'express'
import Table from '../models/table'
import { IOrder } from '../models/order';
import SocketIoHelper from '../helpers/socketio'
import { pushNotice } from '../helpers/notice'
import { Roles } from '../models/user';


export const findOneForValidation: Handler = (req, res, next) => {
	if ('tableNumber' in req.query) {
		let n:number = req.query.tableNumber;
		Table.findOne({number: n})
			.then(table => {
				if (table) {
					return res.status(200).json({ tableFound: true });
				} else {
					return res.status(200).json({ tableFound: false });
				}
			})
			.catch(err => {
				return next({ statusCode: 500, error: true, errormessage: `Server error: ${err._message}` });
			})
	}
}

export const get: Handler = (req, res, next) => {
	let findBlock: any = {};

	if ('tableNumber' in req.params) {
		findBlock['number'] = req.params.tableNumber;
	}
	if ('free' in req.query) {
		findBlock['busy'] = !req.query.free;
	}
	if ('numberOfSeats' in req.query) {
		findBlock['seats'] = req.query.numberOfSeats;
	}
	Table.find(findBlock)
		.populate('services.waiter')
		.populate('services.orders.items.item')
		.then(tables => {
			if (tables.length > 1 || (tables.length == 1 && findBlock['number'] == undefined)) {
				return res.status(200).json({ tables });
			} else if (tables.length == 1 && 'number' in findBlock) {
				return res.status(200).json({ table: tables[0] });
			} else {
				return next({ statusCode: 404, error: true, errormessage: "Table not found" })
			}
		})
		.catch(err => {
			return next({ statusCode: 500, error: true, errormessage: `DB error: ${err._message}` });
		});
}

export const create: Handler = (req, res, next) => {
	let newTable: any = {
		number: req.body.tableNumber,
		seats: req.body.numberOfSeats
	}
	Table.create(newTable)
		.then(table => res.status(200).json({ table }))
		.catch(err => {
			let msg = `DB error: ${err._message}`
			if (err.code === 11000)
				msg = "Table already exists"
			next({ statusCode: 409, error: true, errormessage: msg });
		});
}

export const remove: Handler = (req, res, next) => {
	Table.findOne({ number: req.params.tableNumber })
		.then(data => {
			if (!data)
				res.status(404).json({ error: true, errormessage: `Error occurred: Table ${req.params.tableNumber} number not found` });
			else if (data.services[data.services.length - 1].done) {
				data.remove().then(table => {
					res.status(200).json({ error: false, errormessage: "", result: "Table succesfully deleted" });
				})
			}
			else
				res.status(404).json({ error: true, errormessage: `Error occurred: Table ${req.params.tableNumber} has uncompleted services` });
		})
		.catch(err => next({ statusCode: 500, error: true, errormessage: `DB error: ${err._message | err}` }));
}

export const free: Handler = (req, res, next) => {
	Table.findOne({ number: req.params.tableNumber, 'busy': true })
		.then(table => {
			if (!table)
				return res.status(200).json({ message: "Table already free" });

			table.busy = false;
			table.services.forEach(service => {
				service.done = true;
				service.orders.forEach((order:IOrder) => {
					// @ts-ignore -> mongoose will do the cast stuffs
					order.processed = Date.now();
				});
			});
			table.save((err, doc) => {
				if (err) {
					return next({ statusCode: 500, error: true, errormessage: `DB error 2: ${ err}` });
				}
				pushNotice(req.user.id, Roles.Waiter, `Table number ${doc.number} is now available for new consumers.`, () => {
					SocketIoHelper.emitToRoom(Roles.Waiter, 'tableSetFree');
				});
				res.status(200).json({ message: "Table set free" })
			});
		})
		.catch(err => next({ statusCode: 500, error: true, errormessage: `DB error: ${err._message | err}` }));
}

export const getBill: Handler = (req, res, next) => {
	Table.findOne({ number: req.params.tableNumber })
		.populate({
			path: 'services.orders.items.item',
		})
		.then(table => {
			if (!table)
				return res.status(404).json({ error: true, errormessage: `Error occurred: Table ${req.params.tableNumber} number not found` });
			let bill: number = 0;
			let items: any[] = [];
			// console.log(table.services[0].orders[0].items);
			const service = table.services.find(service => service.done == false);
			service.orders.forEach((order: IOrder) => {
				order.items.forEach(item => {
					// @ts-ignore -> the field is present but is populated with the 'populate' option, so at compile time it is not present
					bill += item.quantity * item.item.price;
					// console.log(item);
					items.push({
						quantity: item.quantity,
						// @ts-ignore
						name: item.item.name,
						// @ts-ignore
						price: item.item.price
					})
				});
			});
			res.status(200).json({ items: items, total: bill });
		})
		.catch(err => {
			let msg = `DB error: ${err}`;
			next({ statusCode: 500, error: true, errormessage: msg });
		});
}

export const update: Handler = (req, res, next) => {
	let updateBlock: any = req.body;
	if ('services' in req.body) {
		updateBlock['$set'] = {services: req.body.services}
	}
	Table.findOneAndUpdate({ number: req.params.tableNumber }, updateBlock)
		.then(table => res.status(200).json({ table }))
		.catch(err => next({ statusCode: 500, error: true, errormessage: `DB error: ${err._message | err}` }));
}