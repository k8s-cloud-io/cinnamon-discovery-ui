const locales = {
    'en': {
        monthNames: {
          long: [
              'January',
              'February',
              'March',
              'April',
              'May',
              'June',
              'July',
              'August',
              'September',
              'October',
              'November',
              'December',
          ],
          short: [
              'Jan',
              'Feb',
              'Mar',
              'Apr',
              'May',
              'Jun',
              'Jul',
              'Aug',
              'Sep',
              'Oct',
              'Nov',
              'Dec'
          ]
        },
        dayNames: {
            long: [
                'Sunday',
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
                'Saturday',
            ],
            short: [
                'Sun',
                'Mon',
                'Tue',
                'Wed',
                'Thu',
                'Fri',
                'Sat'
            ],
            small: [
                'Su',
                'Mo',
                'Tu',
                'We',
                'Th',
                'Fr',
                'Sa'
            ]
        },
        defaultDateFormat: 'YYYY-MM-DD',
        defaultTimeFormat: 'HH:mm',
        defaultDateTimeFormat: 'YYYY-MM-DD HH:mm',
    },
    'de': {
        monthNames: {
            long: [
                'Januar',
                'Februar',
                'März',
                'April',
                'Mai',
                'Juni',
                'Juli',
                'August',
                'September',
                'Oktober',
                'November',
                'Dezember',
            ],
            short: [
                'Jan',
                'Feb',
                'Mär',
                'Apr',
                'Mai',
                'Jun',
                'Jul',
                'Aug',
                'Sep',
                'Okt',
                'Nov',
                'Dez'
            ]
        },
        dayNames: {
            long: [
                'Sonntag',
                'Montag',
                'Dienstag',
                'Mittwoch',
                'Donnerstag',
                'Freitag',
                'Samstag',
            ],
            short: [
                'Son',
                'Mon',
                'Die',
                'Mit',
                'Don',
                'Fre',
                'Sam'
            ],
            small: [
                'So',
                'Mo',
                'Di',
                'Mi',
                'Do',
                'Fr',
                'Sa'
            ]
        },
        defaultDateFormat: 'DD.MM.YYYY',
        defaultTimeFormat: 'HH:mm',
        defaultDateTimeFormat: 'DD.MM.YYYY HH:mm'
    }
}

function Moment(date) {
    this.__date = new Date();
    if(date !== null && date instanceof Date) {
        this.__date = date;
    }
    if(date !== null && date instanceof String) {
        this.__date = new Date(date);
    }

    this.__locale = 'en';

    this.parse = (date, format) => {
        return this;
    }

    this.format = (fmt) => {
        const weekDay = this.__date.getDay();
        const monthDay = this.__date.getDate();
        const month = this.__date.getMonth();
        const year = this.__date.getFullYear();
        const hours = this.__date.getHours();
        const minutes = this.__date.getMinutes();
        const seconds = this.__date.getSeconds();

        let fullMonthNumeric = '' + month + 1;
        if (month < 10) {
            fullMonthNumeric = '0' + fullMonthNumeric;
        }

        let fullMonthDayNumeric = '' + monthDay;
        if (monthDay < 10) {
            fullMonthDayNumeric = '0' + monthDay;
        }

        let fullHours = '' + hours;
        if (hours < 10) {
            fullHours = '0' + hours;
        }

        let fullMinutes = minutes;
        if (minutes < 10) {
            fullMinutes = '0' + minutes;
        }

        let fullSeconds = '' + seconds;
        if (seconds < 10) {
            fullSeconds = '0' + seconds;
        }

        const formatValue = fmt || locales[this.__locale].defaultDateTimeFormat;
        return formatValue
            .replace(/MMMM/, locales[this.__locale].monthNames.long[month])
            .replace(/MMM/, locales[this.__locale].monthNames.short[month])
            .replace(/MM/, fullMonthNumeric)
            .replace(/M/, '' + month)
            .replace(/DD/, fullMonthDayNumeric)
            .replace(/D/, '' + monthDay)
            .replace(/dddd/, locales[this.__locale].dayNames.long[weekDay])
            .replace(/ddd/, locales[this.__locale].dayNames.short[weekDay])
            .replace(/dd/, locales[this.__locale].dayNames.small[weekDay])
            .replace(/d/, '' + weekDay)
            .replace(/YYYY/, '' + year)
            .replace(/HH/, fullHours) // 24h format with leading null
            .replace(/H/, '' + hours) // 24h format with leading null
            .replace(/mm/, '' + fullMinutes)
            .replace(/m/, '' + minutes)
            .replace(/ss/, fullSeconds)
            .replace(/s/, '' + seconds);
    }
}

const rtf = new Intl.RelativeTimeFormat('de', { style: 'long' });

const millisecondsPerSecond = 1000;
const secondsPerMinute = 60;
const minutesPerHour = 60;
const hoursPerDay = 24;
const daysPerWeek = 7;
const intervals = {
    'week':         millisecondsPerSecond * secondsPerMinute * minutesPerHour * hoursPerDay * daysPerWeek,
    'day':          millisecondsPerSecond * secondsPerMinute * minutesPerHour * hoursPerDay,
    'hour':         millisecondsPerSecond * secondsPerMinute * minutesPerHour,
    'minute':       millisecondsPerSecond * secondsPerMinute,
    'second':       millisecondsPerSecond,
}

function formatRelativeTime(/** @type Date */ createTime) {
    const diff = createTime - new Date();
    for (const interval in intervals) {
        if (intervals[interval] <= Math.abs(diff)) {
            return rtf.format(Math.trunc(diff / intervals[interval]), interval);
        }
    }
    return rtf.format(diff / 1000, 'second');
}

module.exports = {
    moment: (date) => {
        return new Moment(date)
    },
    formatRelativeTime
}
