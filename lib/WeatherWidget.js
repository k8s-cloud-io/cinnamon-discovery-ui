const {Clutter, GObject, Gio, St} = imports.gi;
const {HttpClient} = require('./lib/HttpClient');
const {Card} = require('./lib/Card')
const {moment} = require('./lib/moment')

const UPDATE_INTERVAL = 1000 * 60 * 30;

const DAY_LIGHT_MODE = {
    DAY: 0,
    NIGHT: 1
}

const WeatherWidget = GObject.registerClass({
    GTypeName: `WeatherWidget`,
}, class WeatherWidget extends Card {
    constructor(metadata, props) {
        super(props);
        this.metadata = metadata;
        this.cardHeader.setTitleText("Weather");
        this.cardFooter.visible = false;

        this.updateRunning = false;
        this.lastUpdated = 0;
        this.currentDate = new Date();
        this.currentWeather = null;
        this.currentCondition = null;

        this.locationLabel = new St.Label({
            style: 'text-align: center; font-size: 9pt;',
            x_expand: true,
            x_align: Clutter.ActorAlign.CENTER,
        });
        this.addCardContent(this.locationLabel, {expand: false});

        this.currentWeatherLayout = new St.BoxLayout({
            vertical: false,
            x_align: Clutter.ActorAlign.CENTER,
            style: 'padding-bottom: 10px; padding-top: 5px; margin: 0;'
        });
        this.addCardContent(this.currentWeatherLayout, {expand: true});

        this.currentTemperatureLabel = new St.Label({
            style: 'font-weight: 400; font-size: 24pt;',
        });
        this.weatherIcon = new St.Icon({
            //icon_size: 40,
            style: 'width: 42px; height: 42px;'
        });
        this.currentWeatherLayout.add_child(this.weatherIcon);
        this.currentWeatherLayout.add_child(this.currentTemperatureLabel);

        this.currentConditionLabel = new St.Label({
            style: 'padding-left: 30px;padding-top: 5px;font-weight: 400; font-size: 9pt; text-align: right;',
            x_expand: true
        });
        this.currentWeatherLayout.add_child(this.currentConditionLabel, {
            expand: true
        });

        this.forecastLayout = new St.BoxLayout({
            vertical: false,
            x_expand: false,
            y_expand: true,
        });
        this.addCardContent(this.forecastLayout, {expand: true});

        this.lastUpdatedLabel = new St.Label({
            x_align: Clutter.ActorAlign.END,
            style_class: 'small',
            style: 'padding-bottom: 10px;padding-top: 10px;text-align: right;'
        });
        this.addCardContent(this.lastUpdatedLabel, {expand: false});

        this.forecastDays = [
            {}, {}, {}, {}, {}
        ];

        for(let i = 0; i < 5; i++) {
            this.forecastDays[i].layout = new St.BoxLayout({
                vertical: true,
                x_expand: true,
                style: 'background-color: rgba(255, 255, 255, .5);padding-top: 5px; padding-bottom: 5px;border-radius: 3px;font-size: 9pt;margin: 3px;',
            });
            this.forecastDays[i].dayNameLabel = new St.Label({
                style: 'text-align: center;',
            });
            this.forecastDays[i].tempHighLabel = new St.Label({
                style: 'text-align: center;',
            });
            this.forecastDays[i].tempLowLabel = new St.Label({
                style: 'text-align: center;',
            });
            this.forecastDays[i].icon = new St.Icon({
                icon_size: 24,
            })

            this.forecastDays[i].layout.add_child(this.forecastDays[i].dayNameLabel);
            this.forecastDays[i].layout.add_child(this.forecastDays[i].icon);
            this.forecastDays[i].layout.add_child(this.forecastDays[i].tempHighLabel);
            this.forecastDays[i].layout.add_child(this.forecastDays[i].tempLowLabel);
            this.forecastLayout.add_child(this.forecastDays[i].layout, {expand: false});
        }
    }

    updateWeather = () => {
        this.currentDate = new Date();
        // TODO get location from config
        const weatherLocation = 'Miesbach';
        const weatherUrl = `https://api.worldweatheronline.com/premium/v1/weather.ashx?key=320846ac29674a36ac491420250603&q=${weatherLocation}&format=json&num_of_days=5&lang=de`;
        new HttpClient().exec('GET', weatherUrl)
            .then(response => {
                if(response.statusCode() !== 200) {
                    global.log(`Unable to retrieve current image from Unsplash: HTTP status = ${response.statusCode()}`);
                    this.updateRunning = false;
                    return;
                }

                const weather = JSON.parse(response.body());
                const now = moment().format('YYYY-MM-DD');
                this.currentWeather = weather.data.weather.find( w => {
                    const wDate = moment(w.date).format('YYYY-MM-DD');
                    if(now === wDate) {
                        return w;
                    }
                });

                this.currentCondition = weather.data.current_condition[0];
                this.currentTemperatureLabel.text = `${Math.round(this.currentCondition.temp_C)}°`;
                this.currentConditionLabel.text =  this.currentCondition.lang_de[0].value;
                this.locationLabel.text = weather.data.request[0].query;

                const url = this.currentCondition.weatherIconUrl[0].value
                const parsed = url.split('/');
                const fileName = `${this.metadata.path}/assets/${parsed[parsed.length-1]}`;
                let icon = Gio.icon_new_for_string(fileName);
                this.weatherIcon.set_gicon(icon);

                // forecast
                let i = 0;
                weather.data.weather.forEach((record, index) => {
                    const date = new Date(record.date).toLocaleString('de', { weekday: 'short' });
                    const max = record.maxtempC;
                    const min = record.mintempC;

                    this.forecastDays[index].dayNameLabel.text = date || "";
                    this.forecastDays[index].tempHighLabel.text = max.concat("°") || "";
                    this.forecastDays[index].tempLowLabel.text = min.concat("°") || "";

                    const url = record.hourly.filter(h => h.time === '1200')[0].weatherIconUrl[0].value;
                    const parsed = url.split('/');
                    const fileName = `${this.metadata.path}/assets/${parsed[parsed.length-1]}`;
                    let icon = Gio.icon_new_for_string(fileName);
                    this.forecastDays[index].icon.set_gicon(icon);
                })

                this.lastUpdatedLabel.text = (new Intl.DateTimeFormat('de', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                })).format(new Date());

                this.updateTheme();
                this.lastUpdated = new Date().getTime();
                this.updateRunning = false;
            })
            .catch(e => {
            global.log("ERROR IN WEATHER_WIDGET LINE 191: " + e.message);
            this.updateRunning = false;
        })
    }

    startService = () => {
        this.updateWeather();
        setInterval(() => {
            if(this.updateRunning) return;
            const currentDateTime = new Date().getTime();
            const diff = currentDateTime - this.lastUpdated;
            if( diff >= UPDATE_INTERVAL) {
                this.updateRunning = true;
                this.updateWeather();
            }
        }, 1000);
    }

    toH24 = (time) => {
        let hours = Number(time.match(/^(\d+)/)[1]);
        let minutes = Number(time.match(/:(\d+)/)[1]);
        let AMPM = time.match(/\s(.*)$/)[1];
        if(AMPM === "PM" && hours < 12) hours = hours+12;
        if(AMPM === "AM" && hours === 12) hours = hours-12;
        return {
            hours,
            minutes
        };
    }

    updateTheme = () => {
        let {sunrise, sunset} = this.currentWeather.astronomy[0];
        sunrise = this.toH24(sunrise);
        sunset  = this.toH24(sunset);

        const fontColors = {
            'light': '#ffffff',
            'dark': '#333333',
        }

        let backgroundImage = "light-gray";
        let color = 'dark';

        if(this.currentDate.getHours() >= sunset.hours) {
            backgroundImage = 'night';
            color = 'light';
        }
        else
        if(this.currentDate.getHours() < sunrise.hours) {
            backgroundImage = 'night';
            color = 'light';
        }
        else {
            const code = this.currentCondition.weatherCode;
            if(code >= 176) backgroundImage  = "gray";
            if(code > 116) backgroundImage   = "light-gray";
            if(code === 116) backgroundImage = "light-blue";
        }

        const background = `background: url(${this.metadata.path}/assets/weather-${backgroundImage}.svg);`
        this.style += `color: ${fontColors[color]}; ${background}`;
    }
});

/*
{
    let updateRunning = false;
    let lastUpdated = 0;
    let currentDate = new Date();
    let currentWeather = null;
    let currentCondition = null;

    const layout = new Card();
    layout.cardHeader.setTitleText('Wetter');
    layout.cardFooter.visible = false;

    const locationLabel = new St.Label({
        style: 'text-align: center; font-size: 9pt;',
        x_expand: true,
        x_align: Clutter.ActorAlign.CENTER,
    });
    layout.addCardContent(locationLabel, {expand: false});

    const currentWeatherLayout = new St.BoxLayout({
        vertical: false,
        x_align: Clutter.ActorAlign.CENTER,
        style: 'padding-bottom: 10px; padding-top: 5px; margin: 0;'
    });
    layout.addCardContent(currentWeatherLayout, {expand: true});

    const currentTemperatureLabel = new St.Label({
        style: 'font-weight: 400; font-size: 24pt;',
    });
    const weatherIcon = new St.Icon({
        //icon_size: 40,
        style: 'width: 42px; height: 42px;'
    });
    currentWeatherLayout.add_child(weatherIcon);
    currentWeatherLayout.add_child(currentTemperatureLabel);

    const currentConditionLabel = new St.Label({
        style: 'padding-left: 30px;padding-top: 5px;font-weight: 400; font-size: 9pt; text-align: right;',
        x_expand: true
    });
    currentWeatherLayout.add_child(currentConditionLabel, {
        expand: true
    });

    const forecastLayout = new St.BoxLayout({
        vertical: false,
        x_expand: false,
        y_expand: true,
    });
    layout.addCardContent(forecastLayout, {expand: true});

    const lastUpdatedLabel = new St.Label({
        x_align: Clutter.ActorAlign.END,
        style_class: 'small',
        style: 'padding-bottom: 10px;padding-top: 10px;text-align: right;'
    });
    layout.addCardContent(lastUpdatedLabel, {expand: false});

    const forecastDays = [
        {}, {}, {}, {}, {}
    ];

    for(let i = 0; i < 5; i++) {
        forecastDays[i].layout = new St.BoxLayout({
            vertical: true,
            x_expand: true,
            style: 'background-color: rgba(255, 255, 255, .5);padding-top: 5px; padding-bottom: 5px;border-radius: 3px;font-size: 9pt;margin: 3px;',
        });
        forecastDays[i].dayNameLabel = new St.Label({
            style: 'text-align: center;',
        });
        forecastDays[i].tempHighLabel = new St.Label({
            style: 'text-align: center;',
        });
        forecastDays[i].tempLowLabel = new St.Label({
            style: 'text-align: center;',
        });
        forecastDays[i].icon = new St.Icon({
            icon_size: 24,
        })

        forecastDays[i].layout.add_child(forecastDays[i].dayNameLabel);
        forecastDays[i].layout.add_child(forecastDays[i].icon);
        forecastDays[i].layout.add_child(forecastDays[i].tempHighLabel);
        forecastDays[i].layout.add_child(forecastDays[i].tempLowLabel);
        forecastLayout.add_child(forecastDays[i].layout, {expand: false});
    }

    this.getLayout = function() {
        return layout;
    }

    const toH24 = (time) => {
        let hours = Number(time.match(/^(\d+)/)[1]);
        let minutes = Number(time.match(/:(\d+)/)[1]);
        let AMPM = time.match(/\s(.*)$/)[1];
        if(AMPM === "PM" && hours < 12) hours = hours+12;
        if(AMPM === "AM" && hours === 12) hours = hours-12;
        return {
            hours,
            minutes
        };
    }

    const updateTheme = () => {
        let {sunrise, sunset} = currentWeather.astronomy[0];
        sunrise = toH24(sunrise);
        sunset  = toH24(sunset);

        const fontColors = {
            'light': '#ffffff',
            'dark': '#333333',
        }

        let backgroundImage = "yellow";
        let color = 'dark';

        if(currentDate.getHours() >= sunset.hours) {
            backgroundImage = 'night';
            color = 'light';
        }
        else
        if(currentDate.getHours() < sunrise.hours) {
            backgroundImage = 'night';
            color = 'light';
        }
        else {
            const code = currentCondition.weatherCode;
            if(code >= 176) backgroundImage  = "gray";
            if(code > 116) backgroundImage   = "light-gray";
            if(code === 116) backgroundImage = "light-blue";
        }

        const background = `border: 0; box-shadow: 0;background: url(${metadata.path}/assets/weather-${backgroundImage}.svg);`
        layout.style = `color: ${fontColors[color]}; ${background}`;
    }

    const updateWeather = () => {
        currentDate = new Date();
        // TODO get location from config
        const weatherLocation = 'Miesbach';
        const weatherUrl = `https://api.worldweatheronline.com/premium/v1/weather.ashx?key=320846ac29674a36ac491420250603&q=${weatherLocation}&format=json&num_of_days=5&lang=de`;
        new HttpClient().exec('GET', weatherUrl)
            .then(response => {
                if(response.statusCode() !== 200) {
                    global.log(`Unable to retrieve current image from Unsplash: HTTP status = ${response.statusCode()}`);
                    updateRunning = false;
                    return;
                }

                const weather = JSON.parse(response.body());
                const now = moment().format('YYYY-MM-DD');
                currentWeather = weather.data.weather.find( w => {
                    const wDate = moment(w.date).format('YYYY-MM-DD');
                    if(now === wDate) {
                        return w;
                    }
                });

                currentCondition = weather.data.current_condition[0];
                currentTemperatureLabel.text = `${Math.round(currentCondition.temp_C)}°`;
                currentConditionLabel.text =  currentCondition.lang_de[0].value;
                locationLabel.text = weather.data.request[0].query;

                const url = currentCondition.weatherIconUrl[0].value
                const parsed = url.split('/');
                const fileName = `${metadata.path}/assets/${parsed[parsed.length-1]}`;
                let icon = Gio.icon_new_for_string(fileName);
                weatherIcon.set_gicon(icon);

                // forecast
                let i = 0;
                weather.data.weather.forEach((record, index) => {
                    const date = new Date(record.date).toLocaleString('de', { weekday: 'short' });
                    const max = record.maxtempC;
                    const min = record.mintempC;

                    forecastDays[index].dayNameLabel.text = date || "";
                    forecastDays[index].tempHighLabel.text = max.concat("°") || "";
                    forecastDays[index].tempLowLabel.text = min.concat("°") || "";

                    const url = record.hourly.filter(h => h.time === '1200')[0].weatherIconUrl[0].value;
                    const parsed = url.split('/');
                    const fileName = `${metadata.path}/assets/${parsed[parsed.length-1]}`;
                    let icon = Gio.icon_new_for_string(fileName);
                    forecastDays[index].icon.set_gicon(icon);
                })

                lastUpdatedLabel.text = (new Intl.DateTimeFormat('de', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                })).format(new Date());

                updateTheme();
                lastUpdated = new Date().getTime();
                updateRunning = false;
            })
            .catch(e => {
            global.log("ERROR IN WEATHER_WIDGET LINE 191: " + e.message);
            updateRunning = false;
        })
    }

    updateWeather();
    setInterval(() => {
        if(updateRunning) return;
        const currentDateTime = new Date().getTime();
        const diff = currentDateTime - lastUpdated;
        if( diff >= UPDATE_INTERVAL) {
            updateRunning = true;
            //global.log(`Updating Weather...`);
            updateWeather();
        }
    }, 1000);
}
*/
