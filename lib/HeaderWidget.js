const {GLib, St} = imports.gi;

const dateFormatOptions = {
    //weekday: 'long',
    //day: '2-digit',
    //month: 'long',
    //year: 'numeric',
    dateStyle: "long",
    //hour: '2-digit',
    //minute: '2-digit',
    //dayPeriod: 'long',
};
const dateTimeFormat = new Intl.DateTimeFormat('de', dateFormatOptions);

function HeaderWidget() {
    this.dateLabel = new St.Label({
        style_class: 'main-date-label'
    });

    let userName = GLib.get_real_name();
    if(userName.toLowerCase() === 'unknown') {
        userName = GLib.get_user_name();
    }
    const greetingString = `Hallo, ${userName}`
    this.greetingLabel = new St.Label({
        style_class: 'main-greeting-label',
        text: greetingString
    });

    const layout = new St.BoxLayout({
        vertical: true,
        style_class: 'header-widget'
    });
    layout.add_child(this.dateLabel);
    layout.add_child(this.greetingLabel);

    setInterval(() => {
        const date = new Date();
        this.dateLabel.set_text(dateTimeFormat.format(date));
    }, 1000);

    this.getLayout = () => {
        return layout;
    }
}