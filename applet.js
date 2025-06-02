const Applet = imports.ui.applet;
const PopupMenu = imports.ui.popupMenu;
const {Clutter, Gdk, St} = imports.gi;

const {DiscoveryWidget} = require('./lib/DiscoveryWidget');
const {HeaderWidget} = require('./lib/HeaderWidget');
const {WeatherWidget} = require('./lib/WeatherWidget');
const {BingWallpaperWidget} = require('./lib/BingWallpaperWidget');
const {UnsplashWallpaperWidget} = require('./lib/UnsplashWallpaperWidget');
const {CalendarWidget} = require('./lib/CalendarWidget');
const {CardToolbarIcon} = require('./lib/CardToolbarIcon');

const dateFormatOptions = {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    dayPeriod: 'long',
};
const dateTimeFormat = new Intl.DateTimeFormat('de', dateFormatOptions);

class NewsApplet extends Applet.IconApplet {
    constructor(metadata, orientation, panel_height, instance_id) {
        super(orientation, panel_height, instance_id);

        this.set_applet_icon_name("news");
        this.set_applet_tooltip(_("Show News"));

        this.menuManager = new PopupMenu.PopupMenuManager(this);
        this.menu = new Applet.AppletPopupMenu(this, orientation);
        this.menuManager.addMenu(this.menu);

        this.section = new PopupMenu.PopupMenuSection();
        this.menu.addMenuItem(this.section);
        this.menu.setCustomStyleClass('discovery-widget');

        const scrollView = new St.ScrollView({style: `min-width: 580px; padding: 20px;`});
        scrollView.set_policy(St.PolicyType.AUTOMATIC, St.PolicyType.AUTOMATIC);
        scrollView.set_clip_to_allocation(true);

        const contentView = new St.BoxLayout({
            vertical: false,
            y_expand: false,
        });
        scrollView.add_actor(contentView, {expand: false});

        const widgetColumn = new St.BoxLayout({
            vertical: true,
            width: 260,
            y_expand: false,
            x_expand: false,
            y_align: Clutter.ActorAlign.START,
            style: 'margin-right: 10px;'
        });

        const widgetsTitle = new St.Label({
            text: 'Widgets',
            style: 'font-size: 9pt; font-family: sans-serif; padding-left: 5px;padding-bottom: 5px;'
        });
        widgetColumn.add_child(widgetsTitle);
        contentView.add_child(widgetColumn, {expand: false});

        const weatherWidget = new WeatherWidget(metadata);
        widgetColumn.add_child(weatherWidget, {expand: false});

        const bingWallpaperWidget = new BingWallpaperWidget(metadata);
        widgetColumn.add_child(bingWallpaperWidget.getLayout(), {expand: false});

        const unsplashWidget = new UnsplashWallpaperWidget(metadata);
        widgetColumn.add_child(unsplashWidget.getLayout(), {expand: false});

        const calendarWidget = new CalendarWidget(metadata);
        widgetColumn.add_child(calendarWidget, {expand: false});

        const discoveryWidget = new DiscoveryWidget(metadata);
        const feedsTitleLayout = new St.BoxLayout({
            vertical: false,
        });

        const feedsLabel = new St.Label({
            text: 'Mein Feed',
            style: 'font-size: 9pt; font-family: sans-serif;padding-left: 5px;padding-bottom: 5px;',
            x_expand: true,
        });
        feedsTitleLayout.add_child(feedsLabel, {expand: true});

        const reloadIcon = new CardToolbarIcon(`${metadata.path}/assets/reload-icon-dark.svg`);
        reloadIcon.connect('enter-event', () => {
            reloadIcon.setIcon(`${metadata.path}/assets/reload-icon-dark-hover.svg`);
        });
        reloadIcon.connect('leave-event', () => {
            reloadIcon.setIcon(`${metadata.path}/assets/reload-icon-dark.svg`);
        });
        feedsTitleLayout.add_child(reloadIcon);

        const feedsView = new St.BoxLayout({
            vertical: true,
        });
        feedsView.add_child(feedsTitleLayout);
        feedsView.add_child(discoveryWidget.getLayout());
        contentView.add_child(feedsView);

        this.section.actor.add_child(new HeaderWidget().getLayout());
        this.section.actor.add_child(scrollView);

        setInterval(() => {
            const date = new Date();
            this.dateLabel.set_text(dateTimeFormat.format(date));
        }, 1000);

        discoveryWidget.startDiscovery();
        weatherWidget.startService();
    }

    on_applet_clicked() {
        const display = Gdk.Display.get_default();
        const monitor = display.get_monitor(0);
        const geom = monitor.get_geometry();
        const height = Math.ceil(geom.height * 0.8);
        this.section.actor.style = 'height: ' + height + 'px';

        this.menu.toggle();
    }
}

function main(metadata, orientation, panel_height, instance_id) {
    return new NewsApplet(metadata, orientation, panel_height, instance_id);
}

