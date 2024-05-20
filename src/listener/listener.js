
export class Listener {
    _eventListeners = {}; // events 事件
    _eventListenerNames = [
        // TODO add keyboard events
        'mouse-down', // alias of 'mouse-down-left'
        'mouse-down-left',
        'mouse-down-middle',
        'mouse-down-right',
        'mouse-move',
        'mouse-up',
        'mouse-click', // alias of 'mouse-click-left'
        'mouse-click-left',
        'mouse-click-middle',
        'mouse-click-right',
        'mouse-drag-end',
        'pointer-down', // alias of 'pointer-down-left'
        'pointer-down-left', // 按下未抬起
        'pointer-down-middle',
        'pointer-down-right',
        'pointer-move',
        'pointer-up',
        'pointer-click', // alias of 'pointer-click-left' //PointClick是鼠标完成一次点击时调用（按下抬起）
        'pointer-click-left',
        'pointer-click-middle',
        'pointer-click-right',
        'pointer-drag-end',
        'touch-start',
        'touch-move',
        'touch-end',
        'touch-click',
        'touch-drag-end',
        'xr-touchpad-touch-start',
        'xr-touchpad-touch-end',
        'xr-touchpad-press-start',
        'xr-touchpad-press-end',
        'xr-trigger-press-start',
        'xr-trigger-press-end',
    ];
    constructor(canvas){
        this.canvas = canvas;
        this._initCursorListeners(this.canvas, 'mouse'); // legacy support
        this._initCursorListeners(this.canvas, 'pointer');
        this._initTouchListeners(this.canvas);
        // this._raycaster = new THREE.Raycaster();
    }
    // deprecated; for compat only
    setEventListener(eventName, listener) { this.on(eventName, listener); }
    
    on(eventName, listener) {
        if (this._eventListenerNames.includes(eventName)) {
            // aliases
            if (eventName === 'mouse-down') eventName = 'mouse-down-left';
            if (eventName === 'mouse-click') eventName = 'mouse-click-left';
            if (eventName === 'pointer-down') eventName = 'pointer-down-left';
            if (eventName === 'pointer-click') eventName = 'pointer-click-left';

            const listeners = eventName.startsWith('xr-') ?
                this._vrcHelper._eventListeners : this._eventListeners;
            listeners[eventName] = listener;
        } else {
            console.error('@@ on(): unsupported eventName:', eventName);
            if (eventName.startsWith('vr-')) {
                console.info(`${eventName} is deprecated; use 'xr-' instead`);
            }
        }
    }

    _callIfDefined(name, coords) {
        const fn = this._eventListeners[name];
        if (fn) fn(...coords);
    }

    _initCursorListeners(canvas, type) { // `type`: either 'mouse' or 'pointer'
        // https://stackoverflow.com/questions/6042202/how-to-distinguish-mouse-click-and-drag
        let isDragging = false;
        canvas.addEventListener(`${type}down`, e => {
            isDragging = false;
            const coords = Listener.getInputCoords(e, canvas);
            if (e.button === 0) {
                this._callIfDefined(`${type}-down-left`, coords);
            } else if (e.button === 1) {
                this._callIfDefined(`${type}-down-middle`, coords);
            } else if (e.button === 2) {
                this._callIfDefined(`${type}-down-right`, coords);
            }
        }, false);
        canvas.addEventListener(`${type}move`, e => {
            isDragging = true;
            const coords = Listener.getInputCoords(e, canvas);
            this._callIfDefined(`${type}-move`, coords);
        }, false);
        canvas.addEventListener(`${type}up`, e => {
            const coords = Listener.getInputCoords(e, canvas);
            this._callIfDefined(`${type}-up`, coords);

            if (isDragging) {
                this._callIfDefined(`${type}-drag-end`, coords);
            } else {
                console.log(`${type}up: click`);
                if (e.button === 0) {
                    this._callIfDefined(`${type}-click-left`, coords);
                } else if (e.button === 1) {
                    this._callIfDefined(`${type}-click-middle`, coords);
                } else if (e.button === 2) {
                    this._callIfDefined(`${type}-click-right`, coords);
                }
            }
        }, false);
    }
    _initTouchListeners(canvas) {
        let isDragging = false;
        canvas.addEventListener("touchstart", e => {
            isDragging = false;
            const coords = Listener.getInputCoords(e, canvas);
            // console.log('@@ touch start:', ...coords);
            this._callIfDefined('touch-start', coords);
        }, false);
        canvas.addEventListener("touchmove", e => {
            isDragging = true;
            const coords = Listener.getInputCoords(e, canvas);
            // console.log('@@ touch move:', ...coords);
            this._callIfDefined('touch-move', coords);
        }, false);
        canvas.addEventListener("touchend", e => {
            const coords = Listener.getInputCoords(e, canvas);

            // console.log('@@ touch end:', ...coords);
            this._callIfDefined('touch-end', coords);

            if (isDragging) {
                console.log("touchup: drag");
                this._callIfDefined('touch-drag-end', coords);
            } else {
                console.log("touchup: click");
                this._callIfDefined('touch-click', coords);
            }
        }, false);
    }

    // highlevel utils for binding input device events
    setupMouseInterface(cbs) { this._setupInputInterface('mouse', cbs); }
    setupPointerInterface(cbs) { this._setupInputInterface('pointer', cbs); }
    setupTouchInterface(cbs) { this._setupInputInterface('touch', cbs); }
    _setupInputInterface(device, callbacks) {
        const { onClick, onDrag, onDragStart, onDragEnd } = callbacks;
        let _isDragging = false;

        const downEventName = `${device}-${device === 'touch' ? 'start' : 'down'}`;
        this.on(downEventName, (mx, my) => {
            _isDragging = true;
            // console.log('@@ ifce down:', device, mx, my);
            if (onDragStart) onDragStart(mx, my);
        });

        this.on(`${device}-move`, (mx, my) => {
            if (onDrag && _isDragging) onDrag(mx, my);
        });
        this.on(`${device}-drag-end`, (mx, my) => {
            _isDragging = false;
            // console.log('@@ ifce drag end:', device, mx, my);
            if (onDragEnd) onDragEnd(mx, my);
        });
        this.on(`${device}-click`, (mx, my) => {
            _isDragging = false;
            // console.log('@@ ifce click:', device, mx, my);
            if (onClick) onClick(mx, my);
            if (onDragEnd) onDragEnd(mx, my);
        });
    }

    static getInputCoords(e, canvas) {
        // console.log('@@ e:', e, e.type);
        // https://developer.mozilla.org/en-US/docs/Web/API/Touch/clientX
        let x, y;
        if (e.type === 'touchend') {
            [x, y] = [e.changedTouches[0].clientX, e.changedTouches[0].clientY];
        } else if (e.type === 'touchstart' || e.type === 'touchmove') {
            [x, y] = [e.touches[0].clientX, e.touches[0].clientY];
        } else {
            [x, y] = [e.clientX, e.clientY];
        }
        // console.log('getInputCoords(): x, y:', x, y);

        // https://stackoverflow.com/questions/55677/how-do-i-get-the-coordinates-of-a-mouse-click-on-a-canvas-element/18053642#18053642
        const rect = canvas.getBoundingClientRect();
        const [mx, my] = [x - rect.left, y - rect.top];
        // console.log('getInputCoords():', mx, my, canvas.width, canvas.height);
        return [mx, my];
    }
}