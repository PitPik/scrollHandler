;window.IsInViewport = (function(window, undefined) { // 9.93, 3.61, 1.40 KB
    'use strict';

    var _document = window.document,
        _body = _document.body,
        _documentElement = _document.documentElement,
        _rLimit = '(?:\\s+|\\b)',
        functionTimer = 0,
        scrollTop = 0,
        scrollBottom = 0,
        scrollHeight = _body.scrollHeight,
        IsInViewport = function(options) {
            this.options = {
                dataAttribute: 'data-inview',
                className: 'inview',
                offsetTop: 0,
                offsetBottom: 0,
                delay: 100,
                watchTimer: 100
                // callback: [] // or function
            };
            initMe(this, options || {});
        },
        initMe = function(that, options) {
            var timeoutCallback = function(e) {
                    functionTimer = functionTimer ||
                        window.setTimeout(action, that.options.delay);
                },
                action = function(force) {
                    var oldScrollTop = scrollTop;

                    functionTimer = window.clearTimeout(functionTimer);
                    setScrollData();
                    that.speed = scrollTop - oldScrollTop;
                    force && that.initContainers(true);
                    that.scrollTop = scrollTop;
                    that.scrollBottom = scrollBottom;
                    checkIfInViewport(that, force);
                };

            that.callbacks = [];
            // that.container = [];
            // that.elements = [];

            for (var option in options) {
                if (option === 'callback') {
                    option = typeof options[option] === 'function' ?
                        [options[option]] : options[option];
                    for (var n = option.length; n--; ) {
                        that.addCallback(option[n]);
                    }
                } else {
                    that.options[option] = options[option];
                }
            }

            window.addEventListener('scroll', timeoutCallback, false);
            window.addEventListener('resize', timeoutCallback, false);
            that.options.watchTimer && window.setInterval(function() {
                if (_body.scrollHeight !== scrollHeight) {
                    scrollHeight = _body.scrollHeight;
                    action(true);
                }
            }, that.options.watchTimer);

            action(true);
        },
        setScrollData = function(that) {
            scrollTop = _body.scrollTop || _documentElement.scrollTop;
            scrollBottom = scrollTop + _documentElement.offsetHeight;
        },
        checkIfInViewport = function(that, force) {
            var container = {},
                options = {},
                className = '',
                element = {},
                inViewport = false,
                topInViewport = false,
                middleInViewport = false,
                bottomInViewport = false,
                completelyInViewport = false,
                isOldStatus = false,
                gotClassName = false;

            for (var n = 0, m = that.container.length; n < m; n++) {
                container = that.container[n];
                element = container.element,
                options = container.options;
                gotClassName = false;

                topInViewport = container.deltaTop <= scrollBottom &&
                    container.deltaTop >= scrollTop;
                middleInViewport = container.deltaTop <= scrollTop &&
                    container.deltaBottom >= scrollBottom;
                bottomInViewport = container.deltaBottom <= scrollBottom &&
                    container.deltaBottom >= scrollTop;
                inViewport = topInViewport || bottomInViewport || middleInViewport;
                completelyInViewport = topInViewport && bottomInViewport;

                isOldStatus =
                    container.inViewport === inViewport &&
                    container.topInViewport === topInViewport &&
                    container.bottomInViewport === bottomInViewport &&
                    container.completelyInViewport === completelyInViewport;

                if (force || (!inViewport && !isOldStatus)) {
                    className = element.className.replace(new RegExp(
                        _rLimit + options.className + '(?:-\\w+)' +
                            (options.stayInView && container.wasInViewport ?
                                '+' : '*'), 'g'), '');
                    gotClassName = true;
                }

                if (inViewport && !isOldStatus) {
                    !gotClassName && (className = element.className);

                    if (!container.inViewport) {
                        className += container.wasInViewport && options.stayInView ? '' :
                            (className ? ' ' : '') + options.className;
                        container.wasInViewport = true;
                    }
                    if (topInViewport && !container.topInViewport) {
                        className += ' ' + options.classNameTop;
                    } else if (!topInViewport && container.topInViewport) {
                        className = className.replace(' ' + options.classNameTop, '');
                    }
                    if (bottomInViewport && !container.bottomInViewport) {
                        className += ' ' + options.classNameBottom;
                    } else  if (!bottomInViewport && container.bottomInViewport){
                        className = className.replace(' ' + options.classNameBottom, '');
                    }
                    if (completelyInViewport && !container.completelyInViewport) {
                        className += ' ' + options.classNameCompletely;
                    } else  if (!completelyInViewport && container.completelyInViewport){
                        className = className.replace(' ' + options.classNameCompletely, '');
                    }
                }

                if (!isOldStatus) {
                    container.inViewport = inViewport;
                    container.topInViewport = topInViewport;
                    container.bottomInViewport = bottomInViewport;
                    container.completelyInViewport = completelyInViewport;

                    element.className = className;
                }

                if ((inViewport || !isOldStatus) &&
                        options.callback && that.callbacks[options.callback]) {
                    that.callbacks[options.callback].call(that, container);
                }
            }
        };

    IsInViewport.prototype.initContainers = function(force) {
        var data = {},
            origin = {},
            height = 0,
            className = '',
            options = this.options,
            container = {};

        if (force) {
            this.container = [];
            this.elements = _body.querySelectorAll(
                '['+ options.dataAttribute +']');
        }

        for (var n = 0, m = this.elements.length; n < m; n++) {
            className = this.elements[n].className;

            data = JSON.parse(this.elements[n].getAttribute(
                options.dataAttribute).replace(/'/g, '"') || '{}');
            data.offsetTop = data.offsetTop !== undefined ?
                +data.offsetTop : options.offsetTop;
            data.offsetBottom = data.offsetBottom !== undefined ?
                +data.offsetBottom : options.offsetBottom;
            data.className = data.className !== undefined ?
                data.className : options.className;
            data.stayInView = !!data.stayInView || false;
            data.initialClassName = data.initialClassName || false;
            data.classNameTop = data.className + '-top';
            data.classNameBottom = data.className + '-bottom';
            data.classNameCompletely = data.className + '-completely';

            origin = getOrigin(this.elements[n]);
            height = this.elements[n].offsetHeight;

            container = this.container[n] = this.container[n] || {};

            container.element = this.elements[n];
            container.options = data;
            container.top = origin.top;
            container.bottom = origin.top + height;
            container.deltaTop = origin.top - data.offsetTop;
            container.deltaBottom = origin.top + height + data.offsetBottom;
            container.left = origin.left;
            container.height = height;
            container.wasInViewport =
                new RegExp(_rLimit + options.className + _rLimit).test(className);

            if (data.initialClassName) {
                this.elements[n].className = className + (className ? ' ' : '') +
                    data.initialClassName;
            }
        }
    };

    IsInViewport.prototype.addCallback = function(callback) {
        if (!this.callbacks[callback.name]) {
            this.callbacks[callback.name] = callback;
        }
    };

    IsInViewport.prototype.removeCallback = function(callback) {
        delete this.callbacks[callback.name];
    };

    function getOrigin(elm) {
        var box = (elm.getBoundingClientRect) ?
                elm.getBoundingClientRect() : {top: 0, left: 0},
            doc = elm && elm.ownerDocument,
            body = doc.body,
            win = doc.defaultView || doc.parentWindow || window,
            docElem = doc.documentElement || body.parentNode,
            clientTop  = docElem.clientTop  || body.clientTop  || 0,
            clientLeft =  docElem.clientLeft || body.clientLeft || 0;

        return {
            left: box.left + (win.pageXOffset || docElem.scrollLeft) - clientLeft,
            top:  box.top  + (win.pageYOffset || docElem.scrollTop)  - clientTop
        };
    }

    return IsInViewport;
})(window);