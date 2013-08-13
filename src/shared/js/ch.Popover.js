(function (window, $, ch) {
    'use strict';

    if (ch === undefined) {
        throw new window.Error('Expected ch namespace defined.');
    }

    /**
     * Popover improves the native popovers. Popover uses the 'alt' and 'title' attributes to grab its content.
     * @name Popover
     * @class Popover
     * @augments ch.Floats
     * @memberOf ch
     * @param {Object} [conf] Object with configuration properties.
     * @param {Boolean} [conf.fx] Enable or disable UI effects. By default, the effects are enable.
     * @param {String} [conf.points] Sets the points where component will be positioned, specified by configuration or centered by default: "cm cm".
     * @param {String} [conf.offset] Sets the offset in pixels that component will be displaced from original position determined by points. It's specified by configuration or zero by default: "0 0".
     * @returns itself
     * @factorized
     * @see ch.Modal
     * @see ch.Popover
     * @see ch.Zoom
     * @see ch.Flaots
     * @exampleDescription Create a popover.
     * @example
     * var widget = $(".some-element").popover();
     * @exampleDescription Create a new popover with configuration.
     * @example
     * var widget = $("a.example").popover({
     *     "fx": false,
     *     "offset": "10 -10",
     *     "points": "lt rt"
     * });
     * @exampleDescription
     * Now <code>widget</code> is a reference to the popover instance controller.
     * You can set a new content by using <code>widget</code> like this:
     * @example
     * widget.width(300);
     */
    function Popover($el, options) {

        this.init($el, options);

        /**
         * Reference to a internal component instance, saves all the information and configuration properties.
         * @private
         * @type {Object}
         */
        var that = this;

        /**
         * Triggers when the component is ready to use (Since 0.8.0).
         * @name ch.Popover#ready
         * @event
         * @public
         * @since 0.8.0
         * @exampleDescription Following the first example, using <code>widget</code> as popover's instance controller:
         * @example
         * widget.on("ready",function () {
         * this.show();
         * });
         */
        window.setTimeout(function () { that.emit('ready'); }, 50);
    }

    /**
     * Private members
     */
    var $document = $(window.document),

        $body = $('body'),

        parent = ch.util.inherits(Popover, ch.Widget),

        shownbyEvent = {
            'pointertap': ch.onpointertap,
            'pointerenter': ch.onpointerenter
        };

    /**
     * Public members
     */
    Popover.prototype.name = 'popover';

    Popover.prototype.constructor = Popover;

    Popover.prototype._defaults = {
        '_ariaRole': 'dialog',
        '_className': '',
        '_hideDelay': 400,
        'addClass': '',
        'fx': 'fadeIn',
        'width': 'auto',
        'height': 'auto',
        'shownby': 'pointertap',
        'hiddenby': 'button',
        'waiting': '<div class="ch-loading ch-loading-centered"></div>',
        'positioned': 'absolute'
    };

    Popover.prototype.init = function ($el, options) {

        var that = this;

        parent.init.call(this, $el, options);

        this.require('Collapsible', 'Content');

        /**
         * Inner function that resolves the component's layout and returns a static reference.
         * @protected
         * @name ch.Floats#$container
         * @type jQuery
         */
        this.$container = $([
            '<div',
            ' class="ch-popover ch-hide ' + this._options._className + ' ' + this._options.addClass + '"',
            ' role="' + this._options._ariaRole + '"',
            ' id="ch-' + this.name + '-' + this.uid + '"',
            ' style="z-index:' + (ch.util.zIndex += 1) + ';width:' + this._options.width + ';height:' + this._options.height + '"',
            '>'
        ].join('')).on(ch.onpointertap + '.' + this.name, function (event) {
            event.stopPropagation();
        });

        /**
         * Inner reference to content container. Here is where the content will be added.
         * @protected
         * @name ch.Floats#$content
         * @type jQuery
         * @see ch.Content
         */
        this._$content = $('<div class="ch-popover-content">').appendTo(this.$container);

        /**
         * Trigger: Add functionality to the trigger if it exists
         */
        if (this._el !== undefined) {
            this._configureTrigger();
        }

        /**
         * Configure abilities
         */
        this._closable();

        this._positioner = new ch.Positioner({
            'target': this.$container,
            'reference': this._options.reference,
            'side': this._options.side,
            'align': this._options.align,
            'offsetX': this._options.offsetX,
            'offsetY': this._options.offsetY,
            'positioned': this._options.positioned
        });

        /**
         * Bind behaviors
         */

        /**
         * TODO: Define this function on prototye and use bind.
         * $document.on(ch.onchangelayout, this.refreshPosition.bind(this));
         */
        this._refreshPositionListener = function () {
            that._positioner.refresh(options);
            return that;
        };

        // Refersh position on:

        // If the popover hasn't got content, .once('show', this._refreshPositionListener)

        // onchangelayout
        $document.on(ch.onchangelayout, this._refreshPositionListener);

        // resize
        ch.viewport.on(ch.onresize, this._refreshPositionListener);

        // _contentchange
        this.on('_contentchange', this._refreshPositionListener)

            .on('hide', function () {
                that.$container.remove(null, true);
            });

        return this;
    };


    /**
     *
     *
     */
    Popover.prototype._configureTrigger = function () {

        var that = this,
            showHandler = (function () {
                var fn = that._toggle;

                // When a Popover is shown on pointerenter, it will set a timeout to manage when
                // to close the widget. Avoid to toggle and let choise when to close to the timer.
                if (that._options.shownby === 'pointerenter' || that._options.hiddenby === 'none' || that._options.hiddenby === 'button') {
                    fn = function () {
                        if (!that._shown) {
                            that.show();
                        }
                    };
                }

                return fn;
            }());

        // cloneNode(true) > parameters is required. Opera & IE throws and internal error. Opera mobile breaks.
        this._snippet = this._el.cloneNode(true);

        // Use the trigger as the positioning reference
        this._options.reference = this._options.reference || this._$el;

        // Open event when configured as openable
        if (this._options.shownby !== 'none') {
            this._$el
                .addClass('ch-shownby-' + this._options.shownby)
                .on(shownbyEvent[this._options.shownby] + '.' + this.name, function (event) {
                    ch.util.prevent(event);
                    showHandler();
                });
        }

        // Get a content if it's not defined
        if (this._options.content === undefined) {
            // Content from anchor href
            if (this._el.href) {
                this._options.content = this._el.href;

            // Content from title or alt
            } else if (this._el.title || this._el.alt) {
                // Set the configuration parameter
                this._options.content = this._el.title || this._el.alt;
                // Keep the attributes content into the element for possible usage
                this._el.setAttribute('data-title', this._options.content);
                // Avoid to trigger the native tooltip
                this._el.title = this._el.alt = '';
            }
        }

        /**
         *
         * @protected
         * @name ch.Floats#
         * @type jQuery
         */
        this.$trigger = this._$el.attr({
            'aria-owns': 'ch-' + this.name + '-' + this.uid,
            'aria-haspopup': 'true'
        });
    };

    /**
     * Inner show method. Attach the component layout to the DOM tree.
     * @protected
     * @name ch.Popover#innerShow
     * @function
     * @returns itself
     */
    Popover.prototype.show = function (content, options) {

        if (!this._enabled) {
            return this;
        }

        // Do it before content.set, because content.set triggers the position.refresh)
        this.$container.css('z-index', (ch.util.zIndex += 1)).appendTo($body);

        // Open the collapsible
        this._show();

        // Request the content
        if (content !== undefined) {
            this.content(content, options);
        }

        return this;
    };

    /**
     * Inner hide method. Hides the component and detach it from DOM tree.
     * @protected
     * @name ch.Popover#innerHide
     * @function
     * @returns itself
     */
    Popover.prototype.hide = function () {

        if (!this._enabled) {
            return this;
        }

        this._hide();

        return this;
    };

    /**
     * Returns a Boolean if the component's core behavior is shown. That means it will return 'true' if the component is on and it will return false otherwise.
     * @public
     * @function
     * @name ch.Floats#isShown
     * @returns boolean
     */
    Popover.prototype.isShown = function () {
        return this._shown;
    };

    /**
     * Sets or gets the width property of the component's layout. Use it without arguments to get the value. To set a new value pass an argument, could be a Number or CSS value like '300' or '300px'.
     * @public
     * @function
     * @name ch.Floats#width
     * @param {Number|String} [width]
     * @returns itself
     * @see ch.Zarasa#size
     * @see ch.Floats#size
     * @exampleDescription to set the width
     * @example
     * widget.width(700);
     * @exampleDescription to get the width
     * @example
     * widget.width() // 700
     */
    Popover.prototype.width = function (data) {

        if (data === undefined) {
            return this._options.width;
        }

        this.$container.css('width', data);

        this._options.width = data;

        this.refreshPosition();

        return this;
    };

    /**
     * Sets or gets the height of the Float element.
     * @public
     * @function
     * @name ch.Floats#height
     * @returns itself
     * @see ch.Floats#size
     * @exampleDescription to set the height
     * @example
     * widget.height(300);
     * @exampleDescription to get the height
     * @example
     * widget.height // 300
     */
    Popover.prototype.height = function (data) {

        if (data === undefined) {
            return this._options.height;
        }

        this.$container.css('height', data);

        this._options.height = data;

        this.refreshPosition();

        return this;
    };

    /**
     * Refresh the position of the popover if it's shown.
     * @public
     * @function
     * @name ch.Popover#$refreshPosition
     * @example
     * widget.refreshPosition();
     */
    Popover.prototype.refreshPosition = function (options) {
        if (this._shown) {
            this._positioner.refresh(options);
        }

        return this;
    };


    /**
     * Allows to manage the widgets content.
     * @param {String} content - Description.
     * @param {Object} [options] - Description.
     * @private
     */
    Popover.prototype._closable = function () {

        var that = this,
            setTimeout = window.setTimeout,
            clearTimeout = window.clearTimeout,
            hiddenby = this._options.hiddenby,
            pointerTap = ch.onpointertap + '.' + this.name,
            pointerEnter = ch.onpointerenter + '.' + this.name,
            pointerLeave = ch.onpointerleave + '.' + this.name,
            escEvent = ch.onkeyesc || 'touchend',
            timeOut,
            events;

        function hide(event) {
            if (event.target !== that._el && event.target !== that.$container[0]) {
                that.hide();
            }
        }

        function hideTimer() {
            timeOut = setTimeout(function () {
                that.hide();
            }, that._options._hideDelay);
        }

        // Closable none
        if (hiddenby === 'none') { return; }

        // Closable by leaving the widget
        if (hiddenby === 'pointerleave' && that.$trigger !== undefined) {

            events = {};

            events[pointerEnter] = function () {
                clearTimeout(timeOut);
            };

            events[pointerLeave] = hideTimer;

            that.$trigger.on(events);
            that.$container.on(events);
        }

        // Closable by button
        if (hiddenby === 'button' || hiddenby === 'all') {
            // Append a close button
            $('<i class="ch-close" role="button" aria-label="Close"></i>').on(pointerTap, function () {
                that.hide();
            }).prependTo(that.$container);
        }

        if (hiddenby === 'pointers' || hiddenby === 'all') {
            ch.shortcuts.add(escEvent, that.uid, function () { that.hide(); });
            that
                .on('show', function () {
                    ch.shortcuts.on(that.uid);
                    $document.on(pointerTap, hide);
                })
                .on('hide', function () {
                    ch.shortcuts.off(that.uid);
                    $document.off(pointerTap, hide);
                });
        }

        return this;
    };

    Popover.prototype._normalizeOptions = function (options) {
        if (typeof options === 'string' || ch.util.is$(options)) {
            options = {
                'content': options
            };
        }
        return options;
    };

    /**
     * Destroys an Popover instance.
     * @public
     * @function
     * @name ch.Popover#destroy
     */
    Popover.prototype.destroy = function () {

        if (this.$trigger !== undefined) {
            this.$trigger
                .off('.' + this.name)
                .removeClass('ch-' + this.name + '-trigger')
                .removeAttr('data-title')
                .removeAttr('aria-owns')
                .removeAttr('aria-haspopup')
                .removeAttr('data-side')
                .removeAttr('data-align')
                .removeAttr('role')
                .attr('alt', this._snippet.alt)
                .attr('title', this._snippet.title);
        }

        $document.off(ch.onchangelayout, this._refreshPositionListener);
        ch.viewport.off(ch.onresize, this._refreshPositionListener);

        parent.destroy.call(this);
    };

    /**
     * Factory
     */
    ch.factory(Popover, Popover.prototype._normalizeOptions);

}(this, this.ch.$, this.ch));