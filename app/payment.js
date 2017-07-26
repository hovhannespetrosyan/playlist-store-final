'use strict'

const SPSP = require('ilp').SPSP;
const FiveBellsLedgerPlugin = require('ilp-plugin-bells');
const config = require('../config/config');

async function send(sender, senderPass, amount, receiver, message = ""){
    const plugin = new FiveBellsLedgerPlugin({
        account: 'https://' + config['ilpServer'] + '/ledger/accounts/' + sender,
        password: senderPass
    })

    await plugin.connect();
    console.log('connected');

    var quote = await SPSP.quote(plugin, {
        receiver: receiver + '@' + config['ilpServer'],
        sourceAmount: amount
    });

    quote.headers = {
        'Source-Identifier': sender + '@' + config['ilpServer'],
        'Message': message
    }

    console.log("Payment quote is ready");

    return SPSP.sendPayment(plugin, quote);
}

module.exports = send;