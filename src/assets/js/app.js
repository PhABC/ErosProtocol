const ethUtil = require('ethereumjs-util');
const web3Util = require('web3-utils');


var identities = {};
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


window.submitBuy = function() {
  var obj = {
      amountBuy: $("#amountBuy").val(),
      price: $("#price").val(),
      ttl: $("#ttl").val(),
      feeBuy: $("#feeBuy").val()
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
