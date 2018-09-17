[Install Homebridge]: https://github.com/nfarina/homebridge#installation
[Configuration]: #Configuration


# Homebridge-i2cledstrips

Homebridge accessory plugin for LED strips that are connected to an I2C capable device.

[![NPM](https://nodei.co/npm/homebridge-i2cledstrips.png?compact=true)](https://npmjs.org/package/homebridge-i2cledstrips)

# Features
* Control the Brightness and Color of an RGB LED Strip
* Setup automations with the HomeKit UI
* Ask Siri to control your devices

# Setup / Installation
1. [Install Homebridge]
2. `npm install homebridge-i2cledstrips`
3. Edit `config.json` and configure accessory. See [Configuration](#configuration) section.
4. Start Homebridge
5. Star the repository ;)

# Configuration

To configure the plugin add the following to the accessories section in `config.json`.
The i2cAddresses must be in Hex Format, preceded by `0x`. The individual colors (RGB)
are the registers the plugin reads from/writes to, to set the colors.

```json
{
    "accessory": "I2CLedStrip",
    "name": "My LED Strip",
    "i2cAddress": "0x2c",
    "i2cDevice": "/dev/i2c-1",
    "colors": {
        "red": "0x12",
        "green": "0x13",
        "blue": "0x14"
    }
}
```

An example for the Arduino code that works with this plugin can be found [here](examples/ArduinoSample.ino).


# Help
If you have any questions or help please open an issue on the GitHub project page.

# Contributing
Pull requests are always welcome. If you have a device that is not supported yet please open an issue or open a pull request with
your modifications.

# License
The project is subject to the MIT license unless otherwise noted. A copy can be found in the root directory of the project [LICENSE](LICENSE).
