var mongo = require('mongodb');
var mongoose = require('mongoose');
var dataBases = require('../config/database');

mongoose.Promise = require('bluebird');
mongoose.connect(dataBases.userDB, {
    useMongoClient: true,
});

var db = mongoose.connection;

// Pedido Schema
var PedidoSchema = mongoose.Schema({
    numero: {
        type: String,
        index: true
    },
    tipo: {
        type: String,
    },
    descricao: {
        type: String,
    },
    entidade: {
        nome: {
            type: String
        },
        email: {
            type: String
        }
    },
    utilizador: {
        nome: {
            type: String
        },
        email: {
            type: String
        }
    },
    data: {
        type: String
    },
    prazo: {
        type: String
    },
    estado: {
        type: String
    },
    objetoID: {
        type: String
    },
    alteracoes: {
        type: Object
    }
});

var Pedido = module.exports = mongoose.model('Pedido', PedidoSchema);

module.exports.createPedido = function (newPedido, callback) {
    newPedido.save(callback);
}

module.exports.getPedidoByNumber = function (n, callback) {
    var query = { numero: n };
    Pedido.findOne(query, callback);
}

module.exports.getPedidosByState = function (e, callback) {
    var query = { estado: e };
    Pedido.find(query, callback);
}

module.exports.getPedidosByUser = function (e, callback) {
    var query = { 'utilizador.email': e };
    Pedido.find(query, callback);
}

module.exports.getCountPedidos = function (callback) {
    Pedido.count({}, callback);
}

module.exports.getPedidoById = function (id, callback) {
    Pedido.findById(id, callback);
}