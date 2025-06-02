const {Clutter, GObject, St} = imports.gi;

const CARD_HEADER_STYLE = 'height: 33px;';
const CardHeader = GObject.registerClass({
    GTypeName: 'CardHeader',
}, class CardHeader extends St.BoxLayout {
    constructor() {
        super(Object.assign({
            vertical: false,
            visible: false,
            style: CARD_HEADER_STYLE,
            width: 260,
        }));
        this.set_name('CardHeader');
        this.set_clip(0, 0, 260, 30);

        this.cardHeaderTitle = new St.Label({
            style: 'font-size: 8pt;padding-left: 10px;',
            x_expand: true,
            y_expand: false,
            width: 260,
            y_align: Clutter.ActorAlign.CENTER
        });
        this.add_child(this.cardHeaderTitle, {expand: false})
    }

    setAdditionalStyle(value) {
        this.style = CARD_HEADER_STYLE + value;
    }

    setTitleText = (text) => {
        this.cardHeaderTitle.text = text;
        this.visible = true;
    }
});

const CARD_FOOTER_STYLE = 'padding-left: 10px;padding-right: 10px; padding-bottom: 10px;';
const CardFooter = GObject.registerClass({
    GTypeName: 'CardFooter',
}, class CardFooter extends St.BoxLayout {
    constructor() {
        super(Object.assign({
            vertical: false,
            visible: true,
            style: CARD_FOOTER_STYLE,
            width: 260,
            reactive: true
        }));
        this.set_name('CardFooter');
        this.set_clip(0, 0, 260, 30);

        this.cardFooterTitle = new St.Label({
            style: 'font-size: 8pt;padding-left: 10px;',
            x_expand: true,
            y_expand: false,
            y_align: Clutter.ActorAlign.CENTER,
            reactive: true
        });
        this.add_child(this.cardFooterTitle, {expand: false})
    }

    addChild(child, options) {
        this.add_child(child, options);
    }

    setAdditionalStyle(value) {
        this.style = CARD_FOOTER_STYLE + value;
    }

    setText = (text) => {
        this.cardFooterTitle.clutter_text.set_markup(text);
    }
});

const CARD_IMAGE_STYLE = 'z-index: 0;height: 140px;width: 260px; border: 0; background-repeat: no-repeat; background-position: center; background-size: cover;';
const CardImage = GObject.registerClass({
    GTypeName: 'CardImage',
}, class CardImage extends St.Widget {
    constructor(props) {
        super(Object.assign({
            visible: false,
            x_expand: false,
            style: CARD_IMAGE_STYLE,
            z_position: 0,
            width: 260,
            opacity: 0,
            reactive:true
        }));
        this.set_clip(0, 0, 260, 130);
        this.set_name('CardImage');

        this.currentImage = null;
        this.transition = Clutter.PropertyTransition.new('opacity');
        this.transition.connect('completed', () => {
            if(this.transition.animatable.opacity === 0){
                this.style = CARD_IMAGE_STYLE + `background-image: url('${this.currentImage}');`;
                this.transition.set_from(0);
                this.transition.set_to(255);
                this.transition.start();
            }
        });
        this.add_transition(`style_${new Date().getTime()}`,this.transition);


        this.toolbar = new St.BoxLayout({
            style: 'width: 260px; height: 30px; background-color: rgba(0, 0, 0, 0.5);padding-left:10px; padding-right:10px;',
            z_position: 1,
            y: 130,
            visible: false,
            vertical: false,
            width: 260,
            x_expand: false,
            y_expand: false,
            y_align: Clutter.ActorAlign.CENTER
        });
        this.toolbar.set_name('CardImageToolbar');
        this.toolbar.set_clip(0, 0, 260, 30);
        this.add_child(this.toolbar, {expand: false});

        this.connect('enter-event', () => {
            if(this.visible) {
                this.toolbar.y = 100;
            }
        });

        this.connect('leave-event', () => {
            if(this.visible) {
                this.toolbar.y = 130;
            }
        });
    }

    setImagePath(value) {
        this.currentImage = value;
        this.visible = true;
        this.transition.set_from(255);
        this.transition.set_to(0);
        this.transition.set_duration(150);
        this.transition.start();
    }
});

const DEFAULT_CARD_PROPS = {
    style_class: 'card',
    height: 235,
    style: 'border: 1px solid rgba(50, 50, 50, .125); margin-bottom: 5px; background: #fff; max-width: 260px; max-height: 235px; margin: 10px;box-shadow: 0px 2px 1px -1px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 1px 3px 0px rgba(0, 0, 0, 0.12);',
    y_expand: false,
    x_expand: true,
    vertical: true,
    reactive: true
}
const Card = GObject.registerClass({
    GTypeName: `Card`,
}, class Card extends St.BoxLayout {
    constructor(props) {
        super(Object.assign(DEFAULT_CARD_PROPS, props));
        this.set_name('Card');
        this.cardHeader = new CardHeader();
        this.add_child(this.cardHeader);

        this.cardImage = new CardImage();
        this.add_child(this.cardImage, {expand: false});

        this.cardBody = new St.BoxLayout({
            vertical: true,
            y_expand: true,
            x_expand: false,
            style: 'padding-left: 10px; padding-right: 10px;'
        });
        this.add_child(this.cardBody, {expand: false});

        this.cardFooter = new CardFooter();
        this.add_child(this.cardFooter, {expand: false});
    }

    addCardContent(content, props) {
        this.cardBody.add_child(content, props);
    }
});
