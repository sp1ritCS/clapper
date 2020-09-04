const { GObject, Gtk } = imports.gi;

var Controls = GObject.registerClass({
    Signals: {
        'position-seeking-changed': {
            param_types: [GObject.TYPE_BOOLEAN]
        },
        'track-change-requested': {
            param_types: [GObject.TYPE_STRING, GObject.TYPE_INT]
        },
    }
}, class ClapperControls extends Gtk.HBox
{
    _init()
    {
        super._init({
            margin: 4,
            spacing: 4,
            valign: Gtk.Align.END,
        });

        this.togglePlayButton = this.addButton(
            'media-playback-pause-symbolic',
            Gtk.IconSize.LARGE_TOOLBAR
        );
        this.pauseButton = this.addButton(
            'media-playback-start-symbolic',
            Gtk.IconSize.LARGE_TOOLBAR,
            true
        );
        this.playImage = this.pauseButton.image;
        this.pauseImage = this.togglePlayButton.image;

        this.positionScale = new Gtk.Scale({
            orientation: Gtk.Orientation.HORIZONTAL,
            value_pos: Gtk.PositionType.LEFT,
            draw_value: false,
            hexpand: true,
        });
        this.positionScale.connect(
            'button-press-event', this._onPositionScaleButtonPressEvent.bind(this)
        );
        this.positionScale.connect(
            'button-release-event', this._onPositionScaleButtonReleaseEvent.bind(this)
        );

        this.positionAdjustment = this.positionScale.get_adjustment();
        this.pack_start(this.positionScale, true, true, 0);

        this.videoTracksButton = this.addPopoverButton(
            'emblem-videos-symbolic'
        );
        this.audioTracksButton = this.addPopoverButton(
            'emblem-music-symbolic'
        );
        this.subtitleTracksButton = this.addPopoverButton(
            'media-view-subtitles-symbolic'
        );

        this.volumeButton = new Gtk.ScaleButton({
            icons: [
                'audio-volume-muted-symbolic',
                'audio-volume-overamplified-symbolic',
                'audio-volume-low-symbolic',
                'audio-volume-medium-symbolic',
                'audio-volume-high-symbolic',
                'audio-volume-overamplified-symbolic',
                'audio-volume-overamplified-symbolic',
                'audio-volume-overamplified-symbolic',
            ],
            size: Gtk.IconSize.SMALL_TOOLBAR
        });
        let style = this.volumeButton.get_style_context();
        let styleStr = style.to_string(Gtk.StyleContextPrintFlags.SHOW_STYLE);

        if(!styleStr.includes('flat'))
            style.add_class('flat');

        this.volumeButtonImage = this.volumeButton.get_child();
        this.volumeAdjustment = this.volumeButton.get_adjustment();
        this._prepareVolumeButton();
        this.pack_start(this.volumeButton, false, false, 0);

        this.toggleFullscreenButton = this.addButton(
            'view-fullscreen-symbolic'
        );
        this.unfullscreenButton = this.addButton(
            'view-restore-symbolic',
            Gtk.IconSize.SMALL_TOOLBAR,
            true
        );
        this.fullscreenImage = this.toggleFullscreenButton.image;
        this.unfullscreenImage = this.unfullscreenButton.image;

        this.forall(this.setDefaultWidgetBehaviour);
    }

    addButton(iconName, size, noPack)
    {
        size = size || Gtk.IconSize.SMALL_TOOLBAR;

        let button = Gtk.Button.new_from_icon_name(iconName, size);
        this.setDefaultWidgetBehaviour(button);
        button.get_style_context().add_class('flat');

        if(!noPack) {
            this.pack_start(button, false, false, 0);
            button.show();
        }

        return button;
    }

    addPopoverButton(iconName, size)
    {
        let button = this.addButton(iconName, size);

        button.popover = new Gtk.Popover({
            relative_to: button
        });
        button.popoverBox = new Gtk.VBox({
            margin_top: 4,
            margin_bottom: 4,
        });
        button.popover.add(button.popoverBox);
        button.connect('clicked', () => button.popover.popup());

        return button;
    }

    addRadioButtons(box, array, activeId)
    {
        let group = null;

        for(let el of array) {
            let radioButton = new Gtk.RadioButton({
                label: el.label,
                group: group,
            });
            radioButton.trackType = el.type;
            radioButton.trackId = el.value;

            if(radioButton.trackId === activeId)
                radioButton.set_active(true);
            if(!group)
                group = radioButton;

            radioButton.connect(
                'toggled', this._onTrackRadioButtonToggled.bind(this, radioButton)
            );
            box.add(radioButton);
        }
        box.show_all();
    }

    setDefaultWidgetBehaviour(widget)
    {
        widget.can_focus = false;
        widget.can_default = false;
    }

    setVolumeMarks(isAdded)
    {
        if(!isAdded)
            return this.volumeScale.clear_marks();

        this.volumeScale.add_mark(0, Gtk.PositionType.LEFT, '0%');
        this.volumeScale.add_mark(1, Gtk.PositionType.LEFT, '100%');
        this.volumeScale.add_mark(2, Gtk.PositionType.LEFT, '200%');
    }

    _prepareVolumeButton()
    {
        this.volumeAdjustment.set_upper(2.001);
        this.volumeAdjustment.set_step_increment(0.05);
        this.volumeAdjustment.set_page_increment(0.05);

        let popup = this.volumeButton.get_popup();
        let box = popup.get_child();
        let boxChildren = box.get_children();

        for(let child of boxChildren) {
            if(child.constructor === Gtk.Button) {
                box.remove(child);
                child.destroy();
            }
            else if(child.constructor === Gtk.Scale) {
                this.setDefaultWidgetBehaviour(child);
                child.height_request = 200;
                child.round_digits = 2;
                this.volumeScale = child;
                this.setVolumeMarks(true);
            }
        }
    }

    _onTrackRadioButtonToggled(self, radioButton)
    {
        if(!radioButton.get_active())
            return;

        this.emit(
            'track-change-requested',
            radioButton.trackType,
            radioButton.trackId
        );
    }

    _onPositionScaleButtonPressEvent()
    {
        this.isPositionSeeking = true;
        this.emit('position-seeking-changed', this.isPositionSeeking);
    }

    _onPositionScaleButtonReleaseEvent()
    {
        this.isPositionSeeking = false;
        this.emit('position-seeking-changed', this.isPositionSeeking);
    }
});
