const {Clutter, St} = imports.gi;

const ColumnLayout = (columnCount) => {
    const layout = new St.BoxLayout({
        vertical: false,
        y_expand: false,
        y_align: Clutter.ActorAlign.START
    });

    const columns = [];
    for(let i = 0; i < columnCount; i++) {
        const column = new St.BoxLayout({
            vertical: true,
            style: 'width: 260px;',
            x_expand: false,
            y_expand: false,
            y_align: Clutter.ActorAlign.START
        });
        column.set_track_hover(true);
        layout.add_child(column, {expand: false});
        columns.push(column);
    }

    const clear = () => {
        for(let i = 0; i < columnCount; i++) {
            columns[i].remove_all_children();
        }
    }

    const getLayout = () => {
        return layout;
    }

    const getColumns = () => {
        return columns;
    }

    return {
        clear,
        getColumns,
        getLayout
    }
}
