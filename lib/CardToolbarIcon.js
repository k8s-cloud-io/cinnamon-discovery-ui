const {Clutter, Gio, GObject, St} = imports.gi;

const CardToolbarIcon = GObject.registerClass({
    GTypeName: 'CardToolbarIcon',
}, class CardToolbarIcon extends St.Icon {
    constructor(path) {
        super(Object.assign({
            x_expand: false,
            y_expand: false,
            height: 20,
            width: 30,
            icon_size: 20,
            y_align: Clutter.ActorAlign.CENTER,
            reactive: true
        }));
        this.setIcon(path);
    }

    setIcon(path) {
        const icon = Gio.FileIcon.new(
            Gio.File.new_for_path(path)
        );
        this.set_gicon(icon);
    }
});