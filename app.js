var statusText = document.querySelector('#statusText');

var vibrate = "\n(function (Moment) {\n\nvar Timeline = Moment.Timeline,\n    Effect = Moment.Effect,\n    Vibration = Moment.Vibration;\n\nvar quickPulse = new Effect(\n    0, // start at zero intensity (actuator off)\n    75, // end at 75% intensity\n    Moment.Easing.Exponential.in, // ease in with exponential curve\n    500 // exponential transition lasts 500ms\n);\n\nvar tlPulse = new Vibration(\n    Moment.Actuators.topLeft, // select top left actuator\n    quickPulse, // use the 500ms exponential ease in effect\n    0 // begin immediately after tlPulse.start() is called\n);\n\nvar quickIn = new Effect(\n    25, // start at 25% intensity\n    75, // end at 75% intensity\n    Moment.Easing.Quadratic.in, // ease in with quadratic curve\n    400, // quadratic transition lasts 400ms\n    100 // begin 100ms into the quadratic transition (only 300ms of easing)\n);\n\nvar blIn = new Vibration(\n    Moment.Actuators.bottomLeft, // select bottom left actuator\n    quickIn, // use the 400ms quadratic ease in effect\n    2000 // begin effect 200ms after blIn.start() is called\n);\n\nvar fadeOut = new Effect(\n    75, // start at 75% intensity\n    25, // end at 25% intensity\n    Moment.Easing.Linear.out, // ease out with linear curve\n    750 // linear transition lasts 750ms\n);\n\nvar trFade = new Vibration(\n    Moment.Actuators.topRight, // select top right actuator\n    fadeOut, // use the 750ms exponential fade out effect\n    1500 // begin effect after 100ms\n);\n\nvar timeline = new Timeline([tlPulse, blIn, trFade]);\n\ntimeline.start();\n    \n})(Moment);"

statusText.addEventListener('click', function() {
  statusText.textContent = 'Connecting...';
  moment.connect()
  .then(() => {
    statusText.textContent = 'Connected, notifications started';
  })
  .then(moment.compileJSString.bind(moment, vibrate))
  .then(compiled => {
    console.log("compiled " + ab2str(compiled));
    statusText.textContent = 'Compiled';
    return compiled;
  })
  .then(moment.sendArrayBuffer.bind(moment))
  .then(() => {
    statusText.textContent = 'Finshed sending';
  })
  .catch(error => {
    console.log(error);
    statusText.textContent = error;
  });
});

