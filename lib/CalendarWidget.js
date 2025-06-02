const {Clutter, Goa, GObject, St} = imports.gi;
const {HttpClient} = require('./lib/HttpClient');
const {Card} = require("./lib/Card");

Date.prototype.addDays = Date.prototype.addDays || function( days ) {
    this.setDate( this.getDate() + days );
    return this;
};

const UPDATE_INTERVAL = 1000 * 60 * 3;
const dayStyle = `text-align: center; font-size: 8pt; font-weight: 600;`;

const CalendarWidget = GObject.registerClass({
    GTypeName: 'CalendarWidget',
}, class CalendarWidget extends Card {
    constructor() {
        super({
            style: `max-height: 235px; max-width: 260px; background: #e7f0f7;`
        });
        this.cardHeader.setTitleText('Calendar');
        this.cardFooter.visible = false;

        this.updateRunning = false;
        this.lastUpdated = 0;

        this.dayLayout = new St.BoxLayout({
            vertical: false,
            y_align: Clutter.ActorAlign.CENTER,
            style: 'height: 24px;',
            y_expand: false
        });
        this.currentMonthLabel = new St.Label({
            style: 'font-size: 8pt;font-weight: 600;',
            y_align: Clutter.ActorAlign.CENTER,
            x_expand: true
        });
        this.dayLayout.add_child(this.currentMonthLabel);

        this.nextDaysLayout = new St.BoxLayout({
            vertical: false,
            y_align: Clutter.ActorAlign.FILL,
        });
        this.dayLayout.add_child(this.nextDaysLayout);
        this.addCardContent(this.dayLayout);

        this.eventLayout = new St.BoxLayout({
            vertical: true,
            style: 'padding-top: 10px; padding-bottom: 10px;',
            y_expand: false
        });
        this.addCardContent(this.eventLayout);

        this.connect('show', () => {
            this.updateEvents();
            setInterval(() => {
                if(this.updateRunning) return;
                const currentDateTime = new Date().getTime();
                const diff = currentDateTime - this.lastUpdated;
                if( diff >= UPDATE_INTERVAL) {
                    this.updateRunning = true;
                    this.updateEvents();
                }
            }, 1000);
        });
    }

    updateEvents = () => {
        global.log(`Updating Calendar widget...`);
        this.eventLayout.remove_all_children();
        this.nextDaysLayout.remove_all_children();
        const events = [];

        const currentDate = new Date();
        const intlFormatter = new Intl.DateTimeFormat('de', {
            month: 'long'
        });
        this.currentMonthLabel.text = intlFormatter.format(currentDate);

        for(let i = 0; i < 3; i++) {
            let extraStyle = ``;
            if(i === 0) {
                extraStyle = `color: #fff; background: #005fb7;`;
            }

            const date = new Date();
            let day = -1;
            if(i === 0) {
                day = date.getDate();
            } else {
                day = date.addDays(i).getDate();
            }

            const dayLabel = new St.Label({
                style: `width: 24px;${dayStyle}`,
                x_align: Clutter.ActorAlign.CENTER,
                y_align: Clutter.ActorAlign.CENTER,
                text: `${day}`,
            });
            const dayWidget = new St.BoxLayout({
                style: `width: 24px; height: 24px; border-radius: 12px; ${extraStyle}`,
            });
            dayWidget.add_child(dayLabel, {expand: true});
            this.nextDaysLayout.add_child(dayWidget, {expand: true});
        }

        // TODO retrieve data for each account: remove hard coded array access
        const client = Goa.Client.new_sync(null);
        const object = client.get_accounts()[0];
        const calendar = object.get_calendar();
        const calendarUri = calendar.uri;
        const oauth = object.get_oauth2_based();
        const [ok, token, expires ] = oauth.call_get_access_token_sync(null);

        // FOR LATER USE
        // const account = object.get_account();
        // const accountProvider = account['provider-name'];

        const startDate = currentDate;
        startDate.setHours(0);
        const isoStartDate = startDate.toISOString();

        const endDate = currentDate;
        endDate.setHours(23, 59, 59);
        const isoEndDate = endDate.toISOString();

        const uri = `https://www.googleapis.com/calendar/v3/calendars/duskman72@gmail.com/events?timeMin=${isoStartDate}&timeMax=${isoEndDate}`;

        const httpClient = new HttpClient();
        const headers = [
            {
                key: "Authorization",
                value: `Bearer ${token}`,
            }
        ];
        httpClient.exec('GET', uri, headers).then(response => {
            if(response.statusCode() !== 200) {
                global.log(`Unable to retrieve calendar data: HTTP status = ${response.statusCode()}`);
                this.updateRunning = false;
                return;
            }

            const json = JSON.parse(response.body());
            if(!json?.items?.length) {
                const messageLabel = new St.Label({
                    text: 'Keine Termine',
                    style: 'text-align: center; color: #0c62af; font-size: 9pt;',
                    y_expand: false
                });
                this.eventLayout.add_child(messageLabel, {expand: false});

                this.lastUpdated = new Date().getTime();
                this.updateRunning = false;
                global.log(`Update calendar finished.`);
                return;
            }
            else {
                const events = [];
                for(const item of json.items) {
                    const event = {
                        data: {...item, allDay: false},
                    }
                    const itemBox = new St.BoxLayout({
                        vertical: false,
                        y_expand: true,
                        y_align: Clutter.ActorAlign.CENTER,
                        style: 'border: 1px solid red;height: 38px;border-radius: 5px;background: rgba(255, 255, 255, .75);padding: 5px;margin-bottom: 5px;'
                    });

                    const line = new St.Widget({
                        style: 'border-radius: 4px;background: #005fb7;width: 4px;margin-right: 8px;',
                        y_expand: true
                    });
                    itemBox.add_child(line);

                    if(item.start.date && item.end.date) {
                        const startDate = new Date();
                        startDate.setHours(0, 0, 1);

                        const endDate = new Date();
                        endDate.setHours(23, 59, 59);

                        event.data.startTime = startDate
                        event.data.endTime = endDate

                        const eventTimeLabel = new St.Label({
                            text: "All Day",
                            style: 'font-size: 9pt; width: 60px;',
                            y_align: Clutter.ActorAlign.CENTER,
                        });
                        itemBox.add_child(eventTimeLabel);
                    } else {
                        const startTime = new Date(item.start.dateTime);
                        const endTime = new Date(item.end.dateTime);
                        event.data.startTime = startTime;
                        event.data.endTime   = endTime;

                        const eventTimeLabel = new St.Label({
                            text: startTime.toString(),
                            style: 'font-size: 9pt; width: 60px;',
                            y_align: Clutter.ActorAlign.CENTER,
                        });
                        itemBox.add_child(eventTimeLabel);
                    }

                    const eventSummaryLabel = new St.Label({
                        text: item.summary,
                        style: 'font-size: 9pt;',
                        y_expand: true,
                        y_align: Clutter.ActorAlign.CENTER,
                    });
                    eventSummaryLabel.clutter_text.set_line_wrap(true);
                    itemBox.add_child(eventSummaryLabel, {expand: true});

                    event.widget = itemBox;
                    events.push(event);
                }

                events.sort((a, b) => {
                    return a.data.startTime.getTime() - b.data.startTime.getTime();
                });

                for(let i = 0; i < events.length; i++) {
                    this.eventLayout.add_child(events[i].widget);
                }
            }

            this.lastUpdated = new Date().getTime();
            this.updateRunning = false;
            global.log(`Update calendar finished.`);
        }).catch(e => {
            global.log("ERROR IN CalendarWidget line 218: " + e.message);
            this.updateRunning = false;
        });
    }
});
