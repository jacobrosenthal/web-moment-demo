(function() {
  'use strict';

  const MOMENT_UUID     = 'a28e9217-e9b5-4c0a-9217-1c64d051d762',
        JS_SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
        JS_TX_CHAR_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e',
        JS_RX_CHAR_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

  function chunkArray(array, chunkSize){
    var chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  //https://gist.github.com/tokland/71c483c89903da417d7062af009da571
  //todo not sure it would return on the first error..
  function promiseMap(items, mapper) {
    const reducer = (promise, item) => 
      promise.then(mappedItems => mapper(item).then(res => mappedItems.concat([res])));
    return items.reduce(reducer, Promise.resolve([]));
  }

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
    sendArrayBuffer(ab) {
      const chunks = chunkArray(new Uint8Array(ab), 20);
      return promiseMap(chunks, this._writeCharacteristicValue.bind(this, JS_TX_CHAR_UUID));
    }

    /* Moment Service */

    startNotificationsMomentJS() {
      return this._startNotifications(JS_RX_CHAR_UUID);
    }
    stopNotificationsMomentJS() {
      return this._stopNotifications(JS_RX_CHAR_UUID);
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
