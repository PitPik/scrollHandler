# High Performance Scroll Handler

Adding event handlers to the window scroll event is generally not such a good idea. Well, sometimes we do need it for things like lazy loading of images, parallax effects, scroll into view and show, etc. So, if we do, we should use it carefully and smart.

This scroll handler (minified 3.59 KB) gives you
 - smart throttling of event storm
 - caching elements, data, position and states for blasting fast calculations
 - element manipulation only if situation changed (in view port, out of view port)
 - one single element manipulation per cycle if needed at all (minimum DOM-api access)
 - detects changes in view port for re-calculation of container positions
 - possible callbacks for 'per cycle' calculations / manipulations
 - automatically adds containers if added to the DOM

In the [demo](http://dematte.at/scrollHandler) you can see how to make smooth parallax effects with almost no JS effort and very little DOM tree access.

## Usage

Initialize IsInViewport like:
```javascript
var myScroll = new IsInViewport();
```

if you'd like to overwrite some default options then send them with it:
```javascript
var myScroll = new IsInViewport({
        dataAttribute: 'data-inview', // name of data attribute (with options)
        className: 'inview', // class name given if in view (+ additional)
        offsetTop: 0, // top offset when scroll handler should trigger (negative possible)
        offsetBottom: 0, // same as above just with bottom
        delay: 100, // throttling of events (events happen by default every ~16ms)
        watchTimer: 100 // time in ms how often script should look for DOM change (0 = disabled)
        callback: {'myCallbackName': function() {}, ...} // callback for every cycle; default is none (only provision)
    });
```

In your HTML you might have containers you'd like to watch while scrolling that then look like the following:
```HTML
<div class="some-class" data-inview>...</div>
<div class="some-class" data-inview="{'stayInView': true, 'callback': 'paralaxCallback'}">...</div>
```

As you can see, with the second container we set some more individual options. They are the same kind as those above, it just overwrites the global ones for this item. ```callback``` ```stayInView``` are the only exceptions:
 * The global ```callback``` doesn't fire by default, only if it's explicitly set in the data attribute.
 * ```stayInView``` means that the default class name given if this container was in your view port already will stay, even if it scrolls out of the view port.

Now, if your containers get scrolled into view, they automatically get some class names: ```inview``` (as set in options), ```inview-top```, ```inview-bottom```, ```inview-completely```. In your css you now can make your styling, even transitions (maybe use :not()) and use the callback for some extra stuff you want to do (like lazy load images, ...)

**NOTE**: ```IsInViewport``` works best if used as a singleton. If you need to install more than one, then make sure that the option ```dataAttribute: 'data-inview'```is named differently (for example ```data-inview2```), otherwise both instances work on the same elements multiple times.

## API

The following properties can be found when inspecting the instance. This will also be delivered in callback functions as ```this``` besides ```container``` (see below).
```HTML
myScroll:
    callbacks: Array
    container: Array
    elements: NodeList
    options: 
        className: "inview"
        dataAttribute: "data-inview"
        delay: 100
        offsetBottom: 0
        offsetTop: 0
        watchTimer: 100
    scrollBottom: 1000
    scrollTop: 0,
    speed: 0,
    __proto__:
        addCallback: (callback) // {'myCallback': function(){}}
        initContainers: (force) // force triggers new calculations and new collection
        removeCallback: (callbackName) // 'myCallback'
```

The callback delivers some information of the current container:
```HTML
container:
    bottom: 448
    bottomInViewport: true
    completelyInViewport: false
    deltaBottom: 448
    deltaTop: 100
    element: div.some-class
    height: 348
    inViewport: true
    left: 100
    options: Object
        callback: ...
        className: "inview"
        classNameBottom: "inview-bottom"
        classNameCompletely: "inview-completely"
        classNameTop: "inview-top"
        initialClassName: false
        offsetBottom: 0
        offsetTop: 0
        stayInView: false
    top: 100
    topInViewport: false
    wasInViewport: true
```
