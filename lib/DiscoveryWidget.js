const St = imports.gi.St;
const Clutter = imports.gi.Clutter;
const { Bytes, file_get_contents } = imports.gi.GLib;
const { File, UnixSocketAddress, SocketClient } = imports.gi.Gio;
const {ColumnLayout} = require('./lib/ColumnLayout');
const {Card} = require('./lib/Card');
const {RelativeTimeLabel} = require('./lib/RelativeTimeLabel')

const COLUMN_COUNT = 2;

class DiscoveryWidget {
    appletPath = null;
    discoveryData = {}; // holds our database
    currentTab = undefined; // current tab (tabs are translated to categories)
    items = {};
    running = false;
    socketIsOpen = false;
    timer = 0;
    timeOut = 1000 * 60 * 5;

    constructor(metadata) {
        this.appletPath = metadata.path;
        this.columnLayout = ColumnLayout(COLUMN_COUNT);
    }

    getLayout() {
        return this.columnLayout.getLayout();
    }

    loadDiscoveryData() {
        if(this.running) {
            return;
        }

        this.running = true;
        global.log(`updating discovery widget...`);

        try {
            const decoder = new TextDecoder();
            let config = {};
            let configPath = `/etc/cinnamon-discovery/service.json`;

            const file = File.new_for_path(configPath);
            if(!file.query_exists(null)) {
                global.log(`ERROR: unable to read file from ${configPath}`);
                this.running = false;
                return;
            }

            const [ok, content] = file_get_contents(configPath);
            if(ok) {
                const jsonData = decoder.decode(content);
                config = JSON.parse(jsonData);
            } else {
                global.log(`ERROR: unable to read file from ${configPath}`);
                this.running = false;
                return;
            }

            if(config['categories'] === undefined) {
                global.log('ERROR: missing field categories in config file, aborting.');
                this.running = false;
                return;
            }

            const socketFilePath = "/tmp/cinnamon-discovery.sock";
            const socketFile = File.new_for_path(socketFilePath);
            if(!socketFile.query_exists(null)) {
                global.log('ERROR: unable to communicate with cinnamon server: socket is not open.');
                this.running = false;
                this.socketIsOpen = false;
                clearInterval(this.timer);

                return;
            }
            this.socketIsOpen = true;
            const address = UnixSocketAddress.new(socketFilePath);

            this.discoveryData = {};
            const categories = Object.keys(config['categories']);
            if(categories.length === 0) {
                global.log('ERROR: no categories in config file, aborting.');
                this.running = false;
                return;
            }

            if( this.currentTab === undefined) {
                this.currentTab = categories[0];
            }

            let itemCount = 0;
            categories.forEach(category => {
                let client = new SocketClient();
                let connection = client.connect(address, null);

                let input = connection.get_input_stream();
                let output = connection.get_output_stream();

                output.write_bytes(new Bytes(`GET /discovery-items?category=${category} HTTP/1.1\nHost: localhost\n\n`), null);

                let responseData = '';
                while(true) {
                    const bytes = input.read_bytes(4096, null);
                    if(bytes === null || bytes.get_size() === 0) {
                        break;
                    }
                    const data = decoder.decode(bytes.toArray());
                    responseData += data;
                }

                const response = responseData.split("\n\n");
                const headers = response[0].split("\n");
                const body = response[1];
                connection.close(null);

                const newItems = JSON.parse(body);
                itemCount += newItems.length;
                this.items[category] = newItems;
            });

            if(itemCount > 0) {
                try {
                    this.updateLayout();
                } catch(e) {
                    global.log('Discovery Widget: error in updateLayout - ' +  e.message)
                }
            }
        }
        catch(err) {
            global.log(err.message)
        }
        global.log('Discovery Widget: update finished')
        this.running = false;
    }

    startDiscovery() {
        this.loadDiscoveryData();
        this.timer = setInterval(() => {
            this.loadDiscoveryData();
        }, this.timeOut);
    }

    updateLayout() {
        this.columnLayout.clear();
        let count = 0;
        const data = this.items[this.currentTab].sort((a,b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
        data.forEach((item) => {
            const column = count % COLUMN_COUNT;
            const columnLayout = this.columnLayout.getColumns()[column];

            const card = new Card({
                style: 'height: 235px;'
            });
            card.cardImage.setImagePath(item.dataPath);
            card.cardFooter.remove_all_children();
            card.cardFooter.visible = true;

            const relativeTimeLabel = new RelativeTimeLabel({
                style_class: 'small secondary-text',
            });
            relativeTimeLabel.setDateTime(new Date(item.pubDate));
            card.cardFooter.addChild(relativeTimeLabel);

            const titleStyle = 'font-size: 9pt;font-weight: 600;';
            const titleLabel = new St.Label({
                text: item.title.replace(/[\n+]/, '')
                    .replace(/[+]+/g, '')
                    .replace(/\s+/g, ' ')
                    .trim(),
                y_align: Clutter.ActorAlign.FILL,
                y_expand: false,
                x_expand: false,
                style_class: 'fw-600',
                style: titleStyle,
                reactive: true
            });
            titleLabel.clutter_text.set_line_wrap(true);
            card.addCardContent(titleLabel, {expand: false});

            titleLabel.connect('enter-event', () => {
                titleLabel.style = `${titleStyle} color: #005fb7;`;
            });
            titleLabel.connect('leave-event', () => {
                titleLabel.style = `${titleStyle}`;
            });

            columnLayout.add_child(card, {expand: false});
            count++;
        })
    }
}