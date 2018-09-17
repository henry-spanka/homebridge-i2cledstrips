var Service, Characteristic;
var i2c = require('i2c');

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory('homebridge-i2cledstrips', 'I2CLedStrip', I2CLED);
};

function I2CLED(log, config) {

    this.log = log;

    this.name = config.name;
    this.i2cAddress = parseInt(config.i2cAddress);
    this.i2cDevice = config.i2cDevice || '/dev/i2c-1';
    this.color = {
        'red': parseInt(config.colors.red),
        'green': parseInt(config.colors.green),
        'blue': parseInt(config.colors.blue)
    };

    this.cache = {
        'hue': null,
        'saturation': 100,
        'brightness': 100,
        'state': false
    };

    this.wire = new i2c(this.i2cAddress, {
        device: this.i2cDevice
    });

    this.services = {};
}

I2CLED.prototype = {

    /** Required Functions **/
    identify: function(callback) {
        this.log('Identify requested!');
        callback();
    },

    getServices: function() {
        this.services.informationService = new Service.AccessoryInformation();

        this.services.informationService
            .setCharacteristic(Characteristic.Manufacturer, 'Henry Spanka')
            .setCharacteristic(Characteristic.Model, 'I2C LED Strip')
            .setCharacteristic(Characteristic.SerialNumber, this.name);

        this.log('creating Lightbulb');
        this.services.lightbulbService = new Service.Lightbulb(this.name);

        this.services.lightbulbService
            .getCharacteristic(Characteristic.On)
            .on('get', this.getPowerState.bind(this))
            .on('set', this.setPowerState.bind(this));

        this.services.lightbulbService
            .addCharacteristic(new Characteristic.Brightness())
            .on('get', this.getBrightness.bind(this))
            .on('set', this.setBrightness.bind(this));

        this.services.lightbulbService
            .addCharacteristic(new Characteristic.Hue())
            .on('get', this.getHue.bind(this))
            .on('set', this.setHue.bind(this));

        this.services.lightbulbService
            .addCharacteristic(new Characteristic.Saturation())
            .on('get', this.getSaturation.bind(this))
            .on('set', this.setSaturation.bind(this));

        return [this.services.informationService, this.services.lightbulbService];
    },

    getPowerState: function(callback) {
        this.readColors(function(err, red, green, blue) {
            if (err) {
                callback(err);
                return;
            }

            if (red == 0 && green == 0 && blue == 0) {
                this.cache.state = false;
                callback(null, false);
            } else {
                this.cache.state = true;
                callback(null, true);
            }
        }.bind(this));
    },
    setPowerState: function(state, callback) {
        if (state && !this.cache.state) {
            this._setRGB(function(err) {
                if (err) {
                    callback(err);
                } else {
                    this.cache.state = true;
                    callback();
                }
            }.bind(this));
        } else if (!state && this.cache.state) {
            this.setColors(0, 0, 0, function(err) {
                if (err) {
                    callback(err);
                } else {
                    this.cache.state = false;
                    callback();
                }
            }.bind(this));
        } else {
            callback();
        }
    },
    getBrightness: function(callback) {
        callback(null, this.cache.brightness);
    },
    setBrightness: function(level, callback) {
        this.cache.brightness = level;
        this._setRGB(callback);
    },
    getHue: function(callback) {
        this.readColors(function(err, red, green, blue) {
            if (err) {
                callback(err);
                return;
            }

            let levels = this._rgbToHsl(red, green, blue);

            let hue = levels[0];
            this.cache.hue = hue;

            callback(null, hue);
        }.bind(this));
    },
    setHue: function(level, callback) {
        this.cache.hue = level;

        this._setRGB(callback);
    },
    getSaturation: function(callback) {
        this.readColors(function(err, red, green, blue) {
            if (err) {
                callback(err);
                return;
            }

            let levels = this._rgbToHsl(red, green, blue);

            let saturation = levels[1];
            this.cache.saturation = saturation;

            callback(null, saturation);
        }.bind(this));
    },
    setSaturation: function(level, callback) {
        this.cache.saturation = level;

        this._setRGB(callback);
    },

    _setRGB: function(callback) {
        let rgb = this._hsvToRgb(this.cache.hue, this.cache.saturation, this.cache.brightness);

        this.setColors(rgb.r, rgb.g, rgb.b, function(err) {
            if (err) {
                callback(err);
            } else {
                this.getPowerState(function(err, val){
                    if (!err) {
                        this.services.lightbulbService
                            .getCharacteristic(Characteristic.On)
                            .updateValue(val);
                    }
                }.bind(this));
                callback();
            }
        }.bind(this));
    },
    readInteger: function(address, callback) {
        this.wire.readBytes(address, 2, function(error, res) {
            if (error) {
                this.log(error);
                callback(error);
            } else {
                let value = res[0];
                callback(null, parseInt((value << 8) || res[1]));
            }
        }.bind(this));
    },
    writeInteger: function(address, value, callback) {
        bytes = [];
        bytes[0] = (value >> 8) & 0xFF;
        bytes[1] = value & 0xFF;

        this.wire.writeBytes(address, bytes, function(error) {
            if (error) {
                this.log(error);
                callback(error);
                return;
            }
            callback();
        });
    },
    readColors: function(callback) {
        this.readInteger(this.color.red, function(err, red) {
            if (err) {
                callback(err);
                return;
            }
            this.readInteger(this.color.green, function(err2, green) {
                if (err2) {
                    callback(err2);
                    return;
                }
                this.readInteger(this.color.blue, function(err3, blue) {
                    if (err3) {
                        callback(err3);
                        return;
                    }

                    callback(null, red, green, blue);
                }.bind(this));
            }.bind(this));
        }.bind(this));
    },
    setColors: function(red, green, blue, callback) {
        this.writeInteger(this.color.red, red, function(err) {
            if (err) {
                callback(err);
                return;
            }
            this.writeInteger(this.color.green, green, function(err2) {
                if (err2) {
                    callback(err2);
                    return;
                }
                this.writeInteger(this.color.blue, blue, function(err3) {
                    if (err3) {
                        callback(err3);
                        return;
                    }

                    callback();
                }.bind(this));
            }.bind(this));
        }.bind(this));
    },

    /**
     * Converts an HSV color value to RGB. Conversion formula
     * adapted from http://stackoverflow.com/a/17243070/2061684
     * Assumes h in [0..360], and s and l in [0..100] and
     * returns r, g, and b in [0..255].
     *
     * @param   {Number}  h       The hue
     * @param   {Number}  s       The saturation
     * @param   {Number}  l       The lightness
     * @return  {Array}           The RGB representation
     */
    _hsvToRgb: function(h, s, v) {
        var r, g, b, i, f, p, q, t;

        h /= 360;
        s /= 100;
        v /= 100;

        i = Math.floor(h * 6);
        f = h * 6 - i;
        p = v * (1 - s);
        q = v * (1 - f * s);
        t = v * (1 - (1 - f) * s);
        switch (i % 6) {
            case 0:
                r = v;
                g = t;
                b = p;
                break;
            case 1:
                r = q;
                g = v;
                b = p;
                break;
            case 2:
                r = p;
                g = v;
                b = t;
                break;
            case 3:
                r = p;
                g = q;
                b = v;
                break;
            case 4:
                r = t;
                g = p;
                b = v;
                break;
            case 5:
                r = v;
                g = p;
                b = q;
                break;
        }
        var rgb = {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
        return rgb;
    },

    /**
     * Converts an RGB color value to HSL. Conversion formula
     * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
     * Assumes r, g, and b are in [0..255] and
     * returns h in [0..360], and s and l in [0..100].
     *
     * @param   {Number}  r       The red color value
     * @param   {Number}  g       The green color value
     * @param   {Number}  b       The blue color value
     * @return  {Array}           The HSL representation
     */
    _rgbToHsl: function(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        var max = Math.max(r, g, b),
            min = Math.min(r, g, b);
        var h, s, l = (max + min) / 2;

        if (max == min) {
            h = s = 0; // achromatic
        } else {
            var d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                case b:
                    h = (r - g) / d + 4;
                    break;
            }
            h /= 6;
        }

        h *= 360; // return degrees [0..360]
        s *= 100; // return percent [0..100]
        l *= 100; // return percent [0..100]
        return [parseInt(h), parseInt(s), parseInt(l)];
    }

};
