const {Clutter, Gio, GdkPixbuf, GLib, St} = imports.gi;
const {md5} = require('./lib/md5');
const {HttpClient} = require('./lib/HttpClient');
const {Card} = require('./lib/Card')
const {RelativeTimeLabel} = require('./lib/RelativeTimeLabel')
const {setWallpaper, XDG, XDG_DIRECTORY} = require('./lib/System');
const {CardToolbarIcon} = require('./lib/CardToolbarIcon');

let currentWallpaper = null;
const UPDATE_INTERVAL = 1000 * 60 * 60;

function UnsplashWallpaperWidget(metadata) {
    let updateRunning = false;
    let lastUpdated = 0;
    const wallpaperResourceUrl = `https://api.unsplash.com/photos/random?orientation=landscape&client_id=ajmbl4Asbr51ovYYmH9R537KPT2Y3w8XzE3G1niybjM`;

    const layout = new Card();
    layout.cardHeader.visible = false;
    layout.cardFooter.visible = true;
    layout.cardFooter.remove_all_children();
    layout.cardImage.toolbar.visible = true;

    const downloadIcon = new CardToolbarIcon(`${metadata.path}/assets/download-icon.svg`);
    const imageIcon = new CardToolbarIcon(`${metadata.path}/assets/image-icon.svg`);
    const reloadIcon = new CardToolbarIcon(`${metadata.path}/assets/reload-icon.svg`);

    downloadIcon.connect('enter-event', () => {
        downloadIcon.setIcon(`${metadata.path}/assets/download-icon-hover.svg`);
    });
    downloadIcon.connect('leave-event', () => {
        downloadIcon.setIcon(`${metadata.path}/assets/download-icon.svg`);
    });
    imageIcon.connect('enter-event', () => {
        imageIcon.setIcon(`${metadata.path}/assets/image-icon-hover.svg`);
    });
    imageIcon.connect('leave-event', () => {
        imageIcon.setIcon(`${metadata.path}/assets/image-icon.svg`);
    });
    reloadIcon.connect('enter-event', () => {
        reloadIcon.setIcon(`${metadata.path}/assets/reload-icon-hover.svg`);
    });
    reloadIcon.connect('leave-event', () => {
        reloadIcon.setIcon(`${metadata.path}/assets/reload-icon.svg`);
    });

    layout.cardImage.toolbar.add_child(downloadIcon);
    layout.cardImage.toolbar.add_child(imageIcon);

    const overlaySpacer = new St.Widget({x_expand: true});
    layout.cardImage.toolbar.add_child(overlaySpacer);

    reloadIcon.connect('button-press-event', () => updateWallpaper());
    layout.cardImage.toolbar.add_child(reloadIcon, {expand: false});

    imageIcon.connect('button-press-event', () => {
        try {
            const picturesDir = XDG.getDirectory(XDG_DIRECTORY.PICTURES);
            const wallpapersDir = Gio.file_new_for_path(picturesDir + '/wallpapers');
            if(!wallpapersDir.query_exists(null)) {
                wallpapersDir.make_directory_with_parents(null);
            }

            const uri = Gio.file_new_for_uri(this.imageUrlRegular);
            const imagePath = `${wallpapersDir.get_path()}/${uri.get_basename()}`;
            const outFile = Gio.file_new_for_path(imagePath);
            uri.move_async(outFile, Gio.FileCopyFlags.OVERWRITE, GLib.PRIORITY_DEFAULT, null, null, () => {
                setWallpaper(imagePath);
            });
        } catch(e) {
            global.log(`unable to set wallpaper: ${e.message}`);
        }
        return true;
    });

    const updatedLabel = new RelativeTimeLabel({
        style_class: 'small secondary-text',
        style: 'font-size: 8pt;'
    });
    layout.cardFooter.addChild(updatedLabel);

    const subHeadline = new St.Label({
        text: 'Random Unsplash Image',
        style_class: 'small secondary-text',
        style: 'padding-bottom: 5px;'
    });
    layout.addCardContent(subHeadline);

    const titleLabel = new St.Label({
        y_align: Clutter.ActorAlign.FILL,
        y_expand: true,
        style: 'font-size: 9pt;font-weight: 600;',
    });
    titleLabel.clutter_text.set_line_wrap(true);
    layout.addCardContent(titleLabel, {expand: true});

    const spacer = new St.Widget({y_expand: true});
    layout.addCardContent(spacer);

    this.getLayout = () => {
        return layout;
    }

    const cacheDirectory = `${metadata.path}/cache`;
    const dir = Gio.File.new_for_path(cacheDirectory);
    if(!dir.query_exists(null)) {
        dir.make_directory_with_parents(null);
    }

    const updateWallpaper = () => {
        global.log(`Updating Unsplash wallpaper widget...`);
        const client = new HttpClient();
        client.exec('GET', wallpaperResourceUrl)
            .then(response => {
                if(response.statusCode() !== 200) {
                    global.log(`Unable to retrieve current image from Unsplash: HTTP status = ${response.statusCode()}`);
                    updateRunning = false;
                    return;
                }

                const config = JSON.parse(response.body());
                if(!config.urls) {
                    global.log("Unable to retrieve current image from Unsplash: no images found.");
                    updateRunning = false;
                    return;
                }

                titleLabel.text = config.description;
                const imageUrlSmall = config.urls['small'];
                this.imageUrlRegular = config.urls['full'];
                const hash = md5(imageUrlSmall);
                let newCurrentWallpaper = `${cacheDirectory}/${hash}.jpg`;

                const file = Gio.File.new_for_uri(imageUrlSmall);
                const fis = file.read(null);
                newCurrentWallpaper = `${cacheDirectory}/${hash}.jpg`;

                GdkPixbuf.Pixbuf.new_from_stream_async(fis, null, (src, result, data) => {
                    const pixBuf = GdkPixbuf.Pixbuf.new_from_stream_finish(result);
                    const scaled = pixBuf.scale_simple(260, 160, GdkPixbuf.TILES);
                    scaled.savev(newCurrentWallpaper, 'jpeg', ['quality'], ['100']);

                    currentWallpaper = newCurrentWallpaper;
                    layout.cardImage.setImagePath(currentWallpaper);
                });

                updatedLabel.setDateTime(new Date(config.created_at))
                lastUpdated = new Date().getTime();
                updateRunning = false;
        }).catch(e => {
            global.log(`error in widget UnsplashWallpaper: ${e.message}`);
            updateRunning = false;
        });
    }

    updateWallpaper();
    setInterval(() => {
        if(updateRunning) return;
        const currentDateTime = new Date().getTime();
        const diff = currentDateTime - lastUpdated;
        if( diff >= UPDATE_INTERVAL) {
            updateRunning = true;
            updateWallpaper();
        }
    }, 1000 * 60 * 5);
}