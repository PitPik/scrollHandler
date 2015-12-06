// scroll into view
// scroll direction can be seen by inview-top.inview.bottom or inview-bottom.inview.top
;(function(window, undefined) {
    "use strict";

    var instanceCollection = [],
        functionTimer,
        scrollTop = 0,
        scrollBottom = 0,
        IsInViewport = function(options) { // main klass
            this.options = {
                dataAttribute: 'data-inview',
                className: 'inview',
                offsetTop: 0,
                offsetBottom: 0,
                delay: 100 // only settable the first time
            };
            this.container = [];

            initMe(this, options || {});
        },
        initMe = function(that, options) {
            var timeoutCallback;

            for (var option in options) { // overwrites initial options
                that.options[option] = options[option];
            }
            setScrollData();
            that.initContainers();

            if (!instanceCollection.length) { // install eventListeners only once
                timeoutCallback = function() {
                    functionTimer = functionTimer || window.setTimeout(function() {
                        functionTimer = window.clearTimeout(functionTimer);
                        setScrollData();
                        for (var n = 0, m = instanceCollection.length; n < m; n++) {
                            checkIfInViewport(instanceCollection[n]);
                        }
                    }, that.options.delay);
                };
                window.addEventListener('scroll', timeoutCallback, false);
                window.addEventListener('resize', timeoutCallback, false);
            }

            instanceCollection.push(that);
            checkIfInViewport(that);
        },
        setScrollData = function() {
            scrollTop = document.body.scrollTop || document.documentElement.scrollTop;
            scrollBottom = scrollTop + document.documentElement.offsetHeight;
        },
        checkIfInViewport = function(that) { // this function must be performant
            var container, options,
                className = '', originalClassName = '',
                inViewport = false, topInViewport = false, middleInViewport = false,
                bottomInViewport = false, completelyInViewport = false;

            for (var n = 0, m = that.container.length; n < m; n++) { // reverse again...
                container = that.container[n];
                options = container.options;
                className = originalClassName = container.element.className || '';

                topInViewport = container.deltaTop < scrollBottom && container.deltaTop > scrollTop;
                middleInViewport = container.deltaTop < scrollTop && container.deltaBottom > scrollBottom;
                bottomInViewport = container.deltaBottom < scrollBottom && container.deltaBottom > scrollTop;
                inViewport = topInViewport || bottomInViewport || middleInViewport;
                completelyInViewport = topInViewport && bottomInViewport;

                if (inViewport) { // all those IFs make it very performant
                    if (!container.inViewport) {
                        className += container.wasInViewport && options.stayInView ? '' :
                            (className ? ' ' : '') + options.className;
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
                } else if (!inViewport && container.inViewport) {
                    className = originalClassName.replace(new RegExp(
                        '(\\s+?|\\b)' + options.className + '(?:-top|-bottom|-completely)*\\b', 'g'), '');
                    className += (options.stayInView ? (className ? ' ' : '') + options.className : '');
                }

                if (className !== originalClassName) {
                    container.element.className = className;

                    container.inViewport = inViewport;
                    container.topInViewport = topInViewport;
                    container.bottomInViewport = bottomInViewport;
                    container.completelyInViewport = completelyInViewport;
                    container.wasInViewport = true;
                }
            }
        };

    IsInViewport.prototype.initContainers = function() {
        var elements,
            data,
            origin,
            height = 0;

        elements = document.body.querySelectorAll('['+ this.options.dataAttribute +']');
        this.container = []; // reset

        for (var n = 0, m = elements.length; n < m; n++) {
            data = JSON.parse(elements[n].getAttribute(this.options.dataAttribute).replace(/'/g, '"') || '{}'); // ??????
            data.offsetTop = data.offsetTop !== undefined ? +data.offsetTop : this.options.offsetTop;
            data.offsetBottom = data.offsetBottom !== undefined ? +data.offsetBottom : this.options.offsetBottom;
            data.className = data.className !== undefined ? data.className : this.options.className;
            data.stayInView = !!data.stayInView || false;
            data.classNameTop = data.className + '-top';
            data.classNameBottom = data.className + '-bottom';
            data.classNameCompletely = data.className + '-completely';

            origin = getOrigin(elements[n]);
            height = elements[n].offsetHeight;

            this.container.push({
                element: elements[n],
                options: data,
                top: origin.top, // not really needed...
                bottom: origin.top + height, // ...
                deltaTop: origin.top - data.offsetTop,
                deltaBottom: origin.top + height + data.offsetBottom,
                left: origin.left, // ...
                height: height, // ...
                inViewport: false,
                topInViewport: false,
                bottomInViewport: false,
                completelyInViewport: false,
                wasInViewport: false
            });
        }
    };

    // export
    window.IsInViewport = IsInViewport;

    function getOrigin(elm) {
        var box = (elm.getBoundingClientRect) ? elm.getBoundingClientRect() : {top: 0, left: 0},
            doc = elm && elm.ownerDocument,
            body = doc.body,
            win = doc.defaultView || doc.parentWindow || window,
            docElem = doc.documentElement || body.parentNode,
            clientTop  = docElem.clientTop  || body.clientTop  || 0, // border on html or body or both
            clientLeft =  docElem.clientLeft || body.clientLeft || 0;

        return {
            left: box.left + (win.pageXOffset || docElem.scrollLeft) - clientLeft,
            top:  box.top  + (win.pageYOffset || docElem.scrollTop)  - clientTop
        };
    }
})(window);


// swipe
;(function($, window, stage, undefined) {
    "use strict";

    if (!$) {
        if (window.console) {
            console.warn('You need jQuery to enable the swipe event');
        }
        return;
    }

    var THRESHOLD_DISTANCE = 30,
        THRESHOLD_SPEED = 0.5,

        $stage = $(stage),

        pointerType = 'mouse',
        pointerUpNames = {
            mouse: 'mouseup',
            pointer: 'pointerup',
            MSPointerMove: 'MSPointerUp',
            touch: 'touchend'
        },
        pointerMoveNames = {
            mouse: 'mousemove',
            pointer: 'pointermove',
            MSPointerMove: 'MSPointerMove',
            touch: 'touchmove'
        },

        pageXStart = 0,
        pageYStart = 0,
        startTime = 0,
        pageX = 0,
        pageY = 0,

        listeners = [],
        checkSwipeEvents = function(element) {
            listeners = [];

            $(element).parents().andSelf().each(function(idx, elm) {
                if (($._data ? $._data(elm, "events") || {} : {}).swipe) {
                    listeners.push(elm);
                }
            });

            return listeners.length ? listeners : false;
        },

        pointerdown = function(e) {
            var event = e.originalEvent.changedTouches ?
                    e.originalEvent.changedTouches[0] :  e.originalEvent;

            if (checkSwipeEvents(e.target)) {
                // e.preventDefault();
                pointerType = e.type.replace(/down|Down|start/, '');
                $stage.
                    off('.pointermove').
                    on(pointerMoveNames[pointerType] + '.pointermove', pointermove).
                    off('.pointerup').
                    on(pointerUpNames[pointerType] + '.pointerup', pointerup);

                pageXStart = pageX = event.pageX;
                pageYStart = pageY = event.pageY;
                startTime = new Date().getTime();
            }
        },
        pointermove = function(e) {
            var event = e.originalEvent.changedTouches ?
                    e.originalEvent.changedTouches[0] :  e.originalEvent;

            pageX = event.pageX;
            pageY = event.pageY;
        },
        pointerup = function(e) {
            $stage.off('.pointermove .pointerup');
            calculateSwipe();
        },

        calculateSwipe = function() {
            var deltaX = pageX - pageXStart,
                deltaY = pageY - pageYStart,
                distance = Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2)),
                angle = Math.abs(Math.atan(deltaY / deltaX) * (180 / Math.PI)),
                duration = new Date().getTime() -  startTime,
                speed = distance / duration;

            if (distance > THRESHOLD_DISTANCE && speed > THRESHOLD_SPEED) {
                $(listeners).each(function() {
                    $(this).trigger({
                        type: 'swipe',
                        direction: angle < 45 ?
                            (deltaX > 0 ? 'right' : 'left') :
                            (deltaY > 0 ? 'down' : 'up'),
                        pointerType: pointerType,
                        distance: distance,
                        angle: angle,
                        speed: speed
                    });
                });
            }
        },

        $stage = $(stage).on('touchstart.pointerdown mousedown.pointerdown pointerdown.pointerdown', pointerdown);
})(jQuery, window, window);
