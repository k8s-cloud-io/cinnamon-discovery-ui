const {GObject, St} = imports.gi;

const intervals = {
    year  : 24 * 60 * 60 * 1000 * 365,
    month : 24 * 60 * 60 * 1000 * 365/12,
    day   : 24 * 60 * 60 * 1000,
    hour  : 60 * 60 * 1000,
    minute: 60 * 1000,
    second: 1000
}

const RelativeTimeLabel = GObject.registerClass({
    GTypeName: 'RelativeTimeLabel',
}, class RelativeTimeLabel extends St.Label {
    constructor(options) {
        super(Object.assign(options || {}, {y_expand: false}));
        this.rtf = new Intl.RelativeTimeFormat('de', { style: 'long' });

        this.date = new Date();
        this.text = this.formatRelativeTime(this.date);

        setInterval(() => {
            this.text = this.formatRelativeTime(this.date);
        }, 1000);
    }

    formatRelativeTime(/** @type Date */ createTime) {
        const diff = createTime - new Date();
        for (const interval in intervals) {
            if (intervals[interval] <= Math.abs(diff)) {
                return this.rtf.format(Math.trunc(diff / intervals[interval]), interval);
            }
        }
        return this.rtf.format(diff / 1000, 'second');
    }

    setDateTime(date) {
        this.date = date;
    }
});