(function() {
  'use strict';

  const MOMENT_UUID     = 'a28e9217-e9b5-4c0a-9217-1c64d051d762',
        JS_SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
        JS_TX_CHAR_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e',
        JS_RX_CHAR_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

  class Moment {
    constructor() {
      this.device = null;
      this.server = null;
      this._characteristics = new Map();
    }
    connect() {
      let options = {filters:[{
                      services:[ MOMENT_UUID ]}],
                      optionalServices: [JS_SERVICE_UUID]
                    };
      return navigator.bluetooth.requestDevice(options)
      .then(device => {
        this.device = device;
        return device.gatt.connect();
      })
      .then(server => {
        this.server = server;
        return Promise.all([
          server.getPrimaryService(JS_SERVICE_UUID).then(service => {
            return Promise.all([
              this._cacheCharacteristic(service, JS_TX_CHAR_UUID),
              this._cacheCharacteristic(service, JS_RX_CHAR_UUID),
            ])
          })
        ]);
      })
    }
    compileJSString(jsString) {

      const url = "https://firmware.wearmoment.com/compile";
      const options = {
                      method: 'post',
                      headers: { "Content-type": "application/x-www-form-urlencoded; charset=UTF-8" },
                      body: 'js=' + encodeURIComponent(jsString)
                    };

      return fetch(url, options)
      .then(function status(response) {
        if (response.status >= 200 && response.status < 300) {
          return response.arrayBuffer();
        } else {
          return Promise.reject(new Error(response.statusText))
        }
      });
    }
    // chunks your arrayBuffer and sends one 20 byte Uint8Array at a time, will reject on first failure with no retries
    // like characteristic.writeValue, returns a promise with undefined on success
    sendArrayBuffer(ab) {

      //is it just me or are arraybuffers a nightmare without the 100 polyfills otherwise available in npm
      function chunkArray(array, chunkSize){
        var chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
          chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
      }

      //http://2ality.com/2015/10/concatenating-typed-arrays.html
      function concatenate(resultConstructor, ...arrays) {
          let totalLength = 0;
          for (let arr of arrays) {
              totalLength += arr.length;
          }
          let result = new resultConstructor(totalLength);
          let offset = 0;
          for (let arr of arrays) {
              result.set(arr, offset);
              offset += arr.length;
          }
          return result;
      }

      //https://gist.github.com/tokland/71c483c89903da417d7062af009da571
      function promiseMap(items, mapper) {
        const reducer = (promise, item) => 
          promise.then(mappedItems => mapper(item).then(res => mappedItems.concat([res])));
        return items.reduce(reducer, Promise.resolve([]));
      }

      var packetCount = Math.ceil((ab.byteLength + 1) / 20);
      var frame = concatenate(Uint8Array, Uint8Array.of(packetCount), new Uint8Array(ab));
      const chunks = chunkArray(frame, 20);

      return promiseMap(chunks, this._writeCharacteristicValue.bind(this, JS_TX_CHAR_UUID))
        .then(function(result){
          // we never get here except on success, result is [undefined] or an array of [,,]
          // just return undefined as characteristic.writeValue does
          return undefined;
        });
    }

    /* Utils */

    _cacheCharacteristic(service, characteristicUuid) {
      return service.getCharacteristic(characteristicUuid)
      .then(characteristic => {
        this._characteristics.set(characteristicUuid, characteristic);
      });
    }
    _readCharacteristicValue(characteristicUuid) {
      let characteristic = this._characteristics.get(characteristicUuid);
      return characteristic.readValue()
      .then(value => {
        // In Chrome 50+, a DataView is returned instead of an ArrayBuffer.
        value = value.buffer ? value : new DataView(value);
        return value;
      });
    }
    _writeCharacteristicValue(characteristicUuid, value) {
      let characteristic = this._characteristics.get(characteristicUuid);
      return characteristic.writeValue(value);
    }
    _startNotifications(characteristicUuid) {
      let characteristic = this._characteristics.get(characteristicUuid);
      // Returns characteristic to set up characteristicvaluechanged event
      // handlers in the resolved promise.
      return characteristic.startNotifications()
      .then(() => characteristic);
    }
    _stopNotifications(characteristicUuid) {
      let characteristic = this._characteristics.get(characteristicUuid);
      // Returns characteristic to remove characteristicvaluechanged event
      // handlers in the resolved promise.
      return characteristic.stopNotifications()
      .then(() => characteristic);
    }
  }

  window.moment = new Moment();

})();
