var statusText = document.querySelector('#statusText');
var composeText = document.querySelector('#composer');
var send = document.querySelector('#send');

composeText.value = "\n(function (Moment) {\n\nvar Timeline = Moment.Timeline,\n    Effect = Moment.Effect,\n    Vibration = Moment.Vibration;\n\nvar quickPulse = new Effect(\n    0, // start at zero intensity (actuator off)\n    75, // end at 75% intensity\n    Moment.Easing.Exponential.in, // ease in with exponential curve\n    500 // exponential transition lasts 500ms\n);\n\nvar tlPulse = new Vibration(\n    Moment.Actuators.topLeft, // select top left actuator\n    quickPulse, // use the 500ms exponential ease in effect\n    0 // begin immediately after tlPulse.start() is called\n);\n\nvar quickIn = new Effect(\n    25, // start at 25% intensity\n    75, // end at 75% intensity\n    Moment.Easing.Quadratic.in, // ease in with quadratic curve\n    400, // quadratic transition lasts 400ms\n    100 // begin 100ms into the quadratic transition (only 300ms of easing)\n);\n\nvar blIn = new Vibration(\n    Moment.Actuators.bottomLeft, // select bottom left actuator\n    quickIn, // use the 400ms quadratic ease in effect\n    2000 // begin effect 200ms after blIn.start() is called\n);\n\nvar fadeOut = new Effect(\n    75, // start at 75% intensity\n    25, // end at 25% intensity\n    Moment.Easing.Linear.out, // ease out with linear curve\n    750 // linear transition lasts 750ms\n);\n\nvar trFade = new Vibration(\n    Moment.Actuators.topRight, // select top right actuator\n    fadeOut, // use the 750ms exponential fade out effect\n    1500 // begin effect after 100ms\n);\n\nvar timeline = new Timeline([tlPulse, blIn, trFade]);\n\ntimeline.start();\n    \n})(Moment);"

function toString(buffer) { // buffer is an ArrayBuffer
  return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
}

statusText.addEventListener('click', function() {
  statusText.textContent = 'Connecting...';
  moment.connect()
  .then(() => {
    moment.device.addEventListener('gattserverdisconnected', function(){
      statusText.textContent = 'Disconnected';
    });

    statusText.textContent = 'Connected, you may now send';
  })
  .catch(error => {
    console.log(error);
    statusText.textContent = error;
  });
});

send.addEventListener('click', function() {
  moment.compileJSString(composeText.value)
  .then(compiledAB => {
    console.log(composeText.value);
    console.log(toString(compiledAB));
    statusText.textContent = 'Compiled';
    return compiledAB;
  })
  .then(moment.sendArrayBuffer.bind(moment))
  .then(chunks => {
    chunks.forEach(function(chunk, i ){
      console.log("chunk ", i, " ", toString(chunk));
    })
    statusText.textContent = 'Finshed sending';
  })
  .catch(error => {
    console.log(error);
    statusText.textContent = error;
  });
});
