'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _osc = require('osc');

var _osc2 = _interopRequireDefault(_osc);

var _microtime = require('microtime');

var _microtime2 = _interopRequireDefault(_microtime);

var _tinyEmitter = require('tiny-emitter');

var _tinyEmitter2 = _interopRequireDefault(_tinyEmitter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var OSC = function (_Emitter) {
  (0, _inherits3.default)(OSC, _Emitter);

  function OSC() {
    var local = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '0.0.0.0:8888';
    var remote = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '127.0.0.1:9999';
    var broadcast = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    (0, _classCallCheck3.default)(this, OSC);

    var _this = (0, _possibleConstructorReturn3.default)(this, (OSC.__proto__ || (0, _getPrototypeOf2.default)(OSC)).call(this));

    _this._port = new _osc2.default.UDPPort({
      localAddress: local.split(':')[0],
      localPort: parseInt(local.split(':')[1]),
      remoteAddress: remote.split(':')[0],
      remotePort: parseInt(remote.split(':')[1]),
      broadcast: broadcast
    });
    _this._port.on('ready', function () {
      _this.emit('ready');
    });
    _this._port.open();
    return _this;
  }

  (0, _createClass3.default)(OSC, [{
    key: 'sendBundle',
    value: function sendBundle(messages) {
      var tSeconds = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;

      if (!Array.isArray(messages)) {
        messages = [messages];
      }
      if (typeof tSeconds !== 'number') {
        tSeconds = _microtime2.default.nowDouble();
      }
      this._port.send({
        timeTag: _osc2.default.timeTag(tSeconds),
        packets: messages
      });
    }
  }, {
    key: 'close',
    value: function close() {
      this._port.close();
    }
  }], [{
    key: 'buildMessage',
    value: function buildMessage(address) {
      var args = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

      var parsedArgs = new Array(args.length);
      args.map(function (arg, i) {
        if (typeof arg === 'number') {
          parsedArgs[i] = {
            type: 'f',
            value: arg
          };
        } else {
          parsedArgs[i] = {
            type: 's',
            value: arg ? arg.toString() : ''
          };
        }
      });
      return {
        address: address,
        args: parsedArgs
      };
    }
  }]);
  return OSC;
}(_tinyEmitter2.default);

exports.default = OSC;