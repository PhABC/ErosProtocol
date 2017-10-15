const ethUtil = require('ethereumjs-util');
const BigNumber = require("bignumber.js");
const web3Util = require('web3-utils');
const ZeroEx = require('0x.js').ZeroEx;
const abiDecoder = require('abi-decoder');
const DECIMALS = 16;
const NULL_ADDRESS = "0x0000000000000000000000000000000000000000";
const ZRX_ADDRESS = "0x123";
var identities = {};

let EROS_CONTRACT_ABI;
let EROS_CONTRACT_ADDRESS;

let erosContract;

$.getJSON("ErosDiscoveryProtocol.json", (json) => {
    EROS_CONTRACT_ABI = json;
    EROS_CONTRACT_ADDRESS = '0x0123'; // TODO

    erosContract = web3.eth.Contract(EROS_CONTRACT_ABI, EROS_CONTRACT_ADDRESS);

    let abi;
    EROS_CONTRACT_ABI.abi.forEach((obj) => {
        if (obj.name == "settleMatchProposal")
            abi = obj;
    })
    abiDecoder.addABI(abi);
});

const whisperSetup = function () {

  web3.shh.newSymKey((err, sym) => {
    identities['sym'] = sym;
    web3.shh.newKeyPair((err, asym) => {
      identities['asym'] = asym;
    });
  })
};

const sendWhisper = function(identities, payload) {
  const Shh = require('web3-shh');
  const shh = new Shh('ws://localhost:8546');
    console.log(identities);
    shh.post({
      symKeyId: 'c1496cd0731bab44a6c389ef146eb891b5df6e1708058b484966b484847a8fc6',
      ttl: 7,
      topic: '0x676f6c65',
      powTarget: 2.01,
      powTime: 2,
      payload: web3Util.toHex(JSON.stringify(payload))
    }, (err, result) => {
      if(err) return console.error(err)
      if(result) console.log(result)
      console.log('sent');
    });
};

erosContract.events.MatchedEvent({}, (error, event) => {
    if (error)
        throw new Error(error);
    txHash = event.transactionHash;
    web3.eth.getTransaction(txHash).then((tx) => {
        let input = tx.input;
        let inputDecoded = abiDecoder.decodeMethod(input);
        let orderA = {};
        { orderA.maker, orderA.taker, orderA.feeRecipient, orderA.makerTokenAddress,
                orderA.takerTokenAddress } = inputDecoded.params[0].value;
        { orderA.salt, orderA.makerFee, orderA.takerFee, orderA.makerTokenAmount, orderA.takerTokenAmount,
                orderA.expirationUnixTimestampSec } = inputDecoded.params[1].value;
        orderA.ecSignature = [inputDecoded.params[4], inputDecoded.params[3], inputDecoded.params[2]];
        let orderB = {};
        { orderB.maker, orderB.taker, orderB.feeRecipient, orderB.makerTokenAddress,
                orderB.takerTokenAddress } = inputDecoded.params[5].value;
        { orderB.salt, orderB.makerFee, orderB.takerFee, orderB.makerTokenAmount, orderB.takerTokenAmount,
                orderB.expirationUnixTimestampSec } = inputDecoded.params[6].value;
        orderB.ecSignature = [inputDecoded.params[9], inputDecoded.params[8], inputDecoded.params[7]];
    });
});

window.submitBuy = function() {

  var obj = {
      maker: web3.eth.accounts[0],
      taker: NULL_ADDRESS,
      salt: ZeroEx.toBaseUnitAmount(new BigNumber(0.2), DECIMALS),
      minRequestedTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(0.2), DECIMALS),
      requestedTokenAddress: '0x123',
      offeredTokenAddress: '0x1234',
      marketContractAddress: '0x125',
      offeredTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber($("#amountBuy").val()), DECIMALS),
      price: ZeroEx.toBaseUnitAmount(new BigNumber($("#price").val()), DECIMALS),
      expiryTime: ZeroEx.toBaseUnitAmount(new BigNumber($("#ttl").val()), DECIMALS),
      matcherFee: ZeroEx.toBaseUnitAmount(new BigNumber($("#feeBuy").val()), DECIMALS)
  }


  var from = web3.eth.accounts[0];
  var msg = ethUtil.bufferToHex(new Buffer(JSON.stringify(obj), 'utf8'))
  web3.personal.sign(msg, from, function (err, result) {
    if (err) return console.error(err)
    console.log('SIGNED:' + result)

    obj.sig = result;
    return sendWhisper(identities, obj);
  })
}



function submitSell() {
    var obj = {
        amountSell: $("amountSell"),
        pricePay: $("pricePay"),
        ttl2: $("ttl2"),
        feeSell: $("feeSell"),
    }
}

$(function() {
  $(document).foundation();
  whisperSetup();
})
