const {Card} = require('./lib/Card');

const WallpaperWidget = GObject.registerClass({
    GTypeName: 'WallpaperWidget',
}, class WallpaperWidget extends Card {
    constructor(metadata, props) {
        super(props);
        this.cardHeader.visible = false;
        this.cardFooter.visible = true;
        this.cardImage.toolbar.visible = true;
        this.cardFooter.remove_all_children();

        const overlaySpacer = new St.Widget({x_expand: true});
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

        this.cardImage.toolbar.add_child(downloadIcon);
        this.cardImage.toolbar.add_child(imageIcon);
        this.cardImage.toolbar.add_child(overlaySpacer);

        reloadIcon.connect('button-press-event', () => this.updateImage());
        this.cardImage.toolbar.add_child(reloadIcon, {expand: false});

        this.updatedLabel = new RelativeTimeLabel({
            style_class: 'small secondary-text',
            style: 'font-size: 8pt;'
        });
        this.cardFooter.addChild(this.updatedLabel);

        this.subHeadline = new St.Label({
            style_class: 'small secondary-text',
            style: 'padding-bottom: 5px;'
        });
        this.addCardContent(this.subHeadline);

        this.titleLabel = new St.Label({
            y_align: Clutter.ActorAlign.FILL,
            y_expand: true,
            style: 'font-size: 9pt;font-weight: 600;',
        });
        this.titleLabel.clutter_text.set_line_wrap(true);
        this.addCardContent(this.titleLabel, {expand: true});

        const spacer = new St.Widget({y_expand: true});
        this.addCardContent(spacer);
    }

    updateImage() {}
});