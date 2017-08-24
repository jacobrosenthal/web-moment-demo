# Moment Demo

Available at https://jacobrosenthal.github.io/web-moment-demo/

This web app demonstrates the use of the Web Bluetooth API for compiling and sending data to the Moment watch via Bluetooth.

Start the local webserver
```npm run start```

I dont know how to cors so on macos, kill any open chrome process then:
```open -a Google\ Chrome http://localhost:3000 --args --disable-web-security --user-data-dir```

Plug in the Moment to usb, hit the button, feel the vibration, and unplug the usb. Click the word GET and when Moment appears in the ble browser, select it. If your OS asks to pair do so.