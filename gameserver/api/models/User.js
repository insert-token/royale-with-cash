/**
 * User.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    name: {
      type: 'string',
      required: false
    },

    kills: {
      type: 'number',
      defaultsTo: 0,
      required: false
    },

    deaths: {
      type: 'number',
      defaultsTo: 0,
      required: false
    },

    socketId: {
      type: 'string',
      required: false
    },

    paymentAddress: {
      type: 'string',
      required: false
    },

    txid: {
      type: 'string',
      required: false
    }

  },

};

