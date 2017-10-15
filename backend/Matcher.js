const Orders = require('./Orders.js');
const Whisper = require('./Whisper.js');
const Web3 = require('web3');
const BigNumber = require('bignumber.js')

const web3 = new Web3('ws://localhost:8546');
const shh = web3.shh;

class Matcher {
	constructor() {
		this.orderPool = new Orders.OrderPool();

		Whisper.addOnReceivePayload((payload) => { this.receivedPayload(payload); });
	}

	receivedPayload(payload) {
		let order = Orders.orderFromPayload(payload);
		if (this.orderPool.addOrder(order))
			this.newOrder(order);
	}

	newOrder(order) {
		this.orderPool.prune();
		while (true) {
			let match = this.orderPool.findBestMatch(order);
			if (match == null)
				break;
			this.resolveMatch(makerOrder, takerOrder, makerOfferedAmount, takerOfferedAmount);
		}
	}

	resolveMatch(makerOrder, takerOrder, makerOfferedAmount, takerOfferedAmount) {
		this.orderPool.removeOrder(makerOrder);
		this.orderPool.removeOrder(takerOrder);
		console.log('Found match');
		// TODO
	}
}

setTimeout(() => {
	Whisper.sendPayload(new Orders.Order(
		'Alice',
		'market',
		'WETH',
		'ZRX',
		new BigNumber(1),
		new BigNumber(10),
		new BigNumber(0.1),
		new BigNumber(0),
		new BigNumber(1),
		new BigNumber(Date.now() + 60 * 60 * 24),
		new BigNumber(2)
	));

	Whisper.sendPayload(new Orders.Order(
		'Bob',
		'market',
		'ZRX',
		'WETH',
		new BigNumber(1),
		new BigNumber(1),
		new BigNumber(10),
		new BigNumber(0),
		new BigNumber(10),
		new BigNumber(Date.now() + 60 * 60 * 24),
		new BigNumber(2)
	));
}, 500);

let matcher = new Matcher();
