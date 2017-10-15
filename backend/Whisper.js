const Web3 = require('web3');
const web3 = new Web3('ws://localhost:8546');
//const Shh = require('web3-shh');
const shh = web3.shh;

let activeModules = [web3.utils.asciiToHex('golem').slice(0,10), web3.utils.asciiToHex('maker').slice(0,10)];

let data = {};

//let data = "hello";

//web3.eth.sign(data,

const setup1 = () => {
	return shh.newKeyPair()
	.then(id => {
		data.asymKeyId1 = id;
		return shh.getPublicKey(id)
		.then(pubKey => {
			data.asymPubKey = pubKey;
			return shh.newSymKey();
		})
		.then(symKeyId => {
			data.symKeyId = symKeyId;
		}).catch(console.log);
	}).catch(console.log);
};

const setup2 = () => {
	return shh.newKeyPair()
	.then(id => {
		console.log('key2', id);
		data.asymKeyId2 = id;
		return Promise.all([shh.getPublicKey(id), shh.getPrivateKey(id)])
		.then(values => {
			data.pubKey2 = values[0];
			data.privKey2 = values[1];
		}).catch(console.log);
	}).catch(console.log);
};

const initListeners = () => {
	shh.subscribe('messages', {
	    topics: [activeModules[0]],
			symKeyId: data.symKeyId
	}, (err, obj) => {
		if (err) throw new Error(err);
		onReceivePayload(JSON.parse(web3.utils.hexToAscii(obj.payload)));
	});
};

export const sendPayload = (payload) => {
	setup1()
	.then(setup2())
	.then(() => {
		initListeners();

		web3.eth.sign(JSON.stringify(payload),'046Eb57F232e2262059F168Cf098B087d75195Dd')
		.then(sig => {
			payload = {
				...payload,
				sig
			};
			shh.post({
				symKeyId: data.symKeyId,
				ttl: 7,
				topic: activeModules[0],
				powTarget: 2.01,
				powTime: 2,
				payload: web3.utils.toHex(payload),
				sig: data.asymKeyId2,
			});
		})

	});
};

const onReceivePayloadCallbacks = [];

export const addOnReceivePayload = (callback) => {
	onReceivePayloadCallbacks.push(callback);
};

const onReceivePayload = (payload) => {
	onReceivePayloadCallbacks.forEach((callback) => { callback(payload); })
};
