const {Gio, GLib} = imports.gi;

const SET_BACKGROUND_SCHEMA = "org.cinnamon.desktop.background";
const SET_BACKGROUND_KEY = "picture-uri";
let ENV_VARS = null;
let XDG_VARS = null;

const XDG_DIRECTORY = {
    PICTURES: 'XDG_PICTURES_DIR',
    DESKTOP: 'XDG_DESKTOP_DIR',
    DOWNLOAD: 'XDG_DOWNLOAD_DIR',
    TEMPLATES: 'XDG_TEMPLATES_DIR',
    DOCUMENTS: 'XDG_DOCUMENTS_DIR',
    MUSIC: 'XDG_MUSIC_DIR',
    VIDEOS: 'XDG_VIDEOS_DIR',
    PUBLICSHARE: 'XDG_PUBLICSHARE_DIR',
}

const ENV = {
    getEnv: (key) => {
        if(ENV_VARS === null) {
            ENV_VARS = {};
            const env = GLib.get_environ();

            for(let line of env) {
                const parts = line.split(/=/);
                ENV_VARS[parts[0]] = parts[1];
            }
        }
        const strippedKey = key.substring(1);
        return ENV_VARS[strippedKey];
    }
}

const XDG = {
    getDirectory: (name) => {
        if(XDG_VARS === null) {
            const configDir = GLib.get_user_config_dir();
            const xdgFilePath = `${configDir}/user-dirs.dirs`;
            const [ok, bytes] = GLib.file_get_contents(xdgFilePath);
            if(ok) {
                const decoder = new TextDecoder();
                const content = decoder.decode(bytes).replace(/\r\n/g, '\n')
                    .split(/\n/)
                XDG_VARS = {};

                for(let line of content) {
                    if(line.trim().indexOf('#') === 0 || line.trim().length === 0 || line.trim().indexOf('=') < 0) {
                        continue;
                    }

                    const parts = line.split(/=/);
                    const pathParts = parts[1].split('/');
                    const pathData = [];
                    for(let pathPart of pathParts) {
                        pathPart = pathPart.replace(/"/g, '');
                        if(pathPart.indexOf('$') === 0) {
                            const resolvedEnvironmentVariable = ENV.getEnv(pathPart);
                            pathData.push(resolvedEnvironmentVariable);
                            continue;
                        }
                        pathData.push(pathPart);
                    }
                    XDG_VARS[parts[0]] = pathData.join("/");
                }
            }
        }
        return XDG_VARS[name];
    }
}

const setWallpaper = (file) => {
    let wallpaper = file;
    if(wallpaper.indexOf('file://') !== 0) {
        wallpaper = `file://${file}`;
    }
    let settings = new Gio.Settings({ schema: SET_BACKGROUND_SCHEMA });
    settings.set_string(SET_BACKGROUND_KEY, wallpaper);
}

module.exports = {
    setWallpaper,
    XDG_DIRECTORY,
    XDG,
    ENV,
}