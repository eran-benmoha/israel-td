import Phaser from "phaser";
import { Events } from "../core/events";

/**
 * Centralised input controller.
 *
 * Owns every Phaser-canvas and DOM keyboard listener so that
 * MapSystem stays focused on projection / rendering and the rest of
 * the game can react to high-level input intents via the EventBus.
 *
 * Supports:
 *  - Pointer drag (mouse + touch) → map pan
 *  - Two-finger pinch → zoom
 *  - Mouse wheel → zoom
 *  - Arrow / WASD keys → continuous map pan
 *  - +/- keys → zoom step
 *  - Keyboard shortcuts: ` (debug), B (shop), Space (launch wave)
 */
export class InputSystem {
  constructor({ scene, eventBus, mapViewConfig }) {
    this.scene = scene;
    this.eventBus = eventBus;
    this.mapViewConfig = mapViewConfig;

    this.mapSystem = null;

    this.phaserHandlers = [];
    this.domHandlers = [];

    this.panKeysHeld = { up: false, down: false, left: false, right: false };
    this.keyboardPanSpeed = 6;

    this.pinchStartDistance = 0;
    this.pinchStartZoomLevel = mapViewConfig.initial.zoomLevel;

    this.viewportWidth = 0;
    this.viewportHeight = 0;
  }

  bindMapControls(mapSystem, viewportWidth, viewportHeight) {
    this.mapSystem = mapSystem;
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;

    this.scene.input.addPointer(1);
    this._registerPointerHandlers();
    this._registerKeyboardHandlers();
    this._applyCursor();
  }

  onResize(width, height) {
    this.viewportWidth = width;
    this.viewportHeight = height;
  }

  update() {
    if (!this.mapSystem) return;

    const { up, down, left, right } = this.panKeysHeld;
    if (!up && !down && !left && !right) return;

    const speed = this.keyboardPanSpeed / (this.mapSystem.mapContainer?.scaleX ?? 1);
    let dx = 0;
    let dy = 0;
    if (left) dx += speed;
    if (right) dx -= speed;
    if (up) dy += speed;
    if (down) dy -= speed;

    this.mapSystem.panBy(dx, dy, this.viewportWidth, this.viewportHeight);
  }

  // -- pointer (mouse + touch) ------------------------------------------------

  _registerPointerHandlers() {
    const camera = this.scene.cameras.main;
    const ms = this.mapSystem;

    let isDragging = false;
    let dragPointerId = null;
    let dragStartWorldX = 0;
    let dragStartWorldY = 0;
    let mapStartX = ms.mapContainer.x;
    let mapStartY = ms.mapContainer.y;

    const getActiveTouchPointers = () =>
      [this.scene.input.pointer1, this.scene.input.pointer2].filter(
        (p) => p?.isDown,
      );
    const isPinching = () => getActiveTouchPointers().length >= 2;

    const beginPinch = () => {
      const [a, b] = getActiveTouchPointers();
      if (!a || !b) return;
      this.pinchStartDistance = Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
      this.pinchStartZoomLevel = ms.zoomLevel;
      isDragging = false;
      dragPointerId = null;
    };

    const applyPinch = () => {
      const [a, b] = getActiveTouchPointers();
      if (!a || !b) return;
      if (this.pinchStartDistance <= 0) beginPinch();
      const distance = Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2;
      const ratio = this.pinchStartDistance > 0 ? distance / this.pinchStartDistance : 1;
      const nextZoom = Phaser.Math.Clamp(
        this.pinchStartZoomLevel * ratio,
        ms.minZoomLevel,
        ms.maxZoomLevel,
      );
      ms.applyZoomAtScreenPoint(nextZoom, midX, midY, this.viewportWidth, this.viewportHeight);
    };

    const pointerDown = (pointer) => {
      if (isPinching()) { beginPinch(); return; }
      const startWorld = camera.getWorldPoint(pointer.x, pointer.y);
      isDragging = true;
      dragPointerId = pointer.id;
      dragStartWorldX = startWorld.x;
      dragStartWorldY = startWorld.y;
      mapStartX = ms.mapContainer.x;
      mapStartY = ms.mapContainer.y;
    };

    const pointerMove = (pointer) => {
      if (isPinching()) { applyPinch(); return; }
      if (!isDragging || !pointer.isDown || pointer.id !== dragPointerId) return;
      const currentWorld = camera.getWorldPoint(pointer.x, pointer.y);
      ms.mapContainer.x = mapStartX + (currentWorld.x - dragStartWorldX);
      ms.mapContainer.y = mapStartY + (currentWorld.y - dragStartWorldY);
      ms.clampMapPosition(this.viewportWidth, this.viewportHeight);
    };

    const stopDrag = () => {
      if (isPinching()) { beginPinch(); return; }
      isDragging = false;
      dragPointerId = null;
      this.pinchStartDistance = 0;
      const [remaining] = getActiveTouchPointers();
      if (remaining) {
        const rw = camera.getWorldPoint(remaining.x, remaining.y);
        isDragging = true;
        dragPointerId = remaining.id;
        dragStartWorldX = rw.x;
        dragStartWorldY = rw.y;
        mapStartX = ms.mapContainer.x;
        mapStartY = ms.mapContainer.y;
      }
    };

    const wheel = (_pointer, _gameObjects, _deltaX, deltaY) => {
      const zoomFactor = Math.exp(-deltaY * 0.0012);
      const nextZoom = Phaser.Math.Clamp(
        ms.zoomLevel * zoomFactor,
        ms.minZoomLevel,
        ms.maxZoomLevel,
      );
      ms.applyZoomAtScreenPoint(
        nextZoom,
        _pointer.x,
        _pointer.y,
        this.viewportWidth,
        this.viewportHeight,
      );
    };

    const bind = (name, fn) => {
      this.scene.input.on(name, fn);
      this.phaserHandlers.push({ eventName: name, handler: fn });
    };

    bind("pointerdown", pointerDown);
    bind("pointermove", pointerMove);
    bind("pointerup", stopDrag);
    bind("pointerupoutside", stopDrag);
    bind("wheel", wheel);
  }

  // -- keyboard ----------------------------------------------------------------

  _registerKeyboardHandlers() {
    const PAN_CODES = {
      ArrowUp: "up", KeyW: "up",
      ArrowDown: "down", KeyS: "down",
      ArrowLeft: "left", KeyA: "left",
      ArrowRight: "right", KeyD: "right",
    };

    const onKeyDown = (e) => {
      if (this._isTypingInInput(e)) return;

      const panDir = PAN_CODES[e.code];
      if (panDir) {
        this.panKeysHeld[panDir] = true;
        e.preventDefault();
        return;
      }

      switch (e.code) {
        case "Equal":
        case "NumpadAdd":
          this._stepZoom(1.15);
          e.preventDefault();
          break;
        case "Minus":
        case "NumpadSubtract":
          this._stepZoom(1 / 1.15);
          e.preventDefault();
          break;
        case "KeyB":
          this._clickDomButton("shop-toggle");
          e.preventDefault();
          break;
        case "Backquote":
          this._clickDomButton("debug-toggle");
          e.preventDefault();
          break;
        case "Space":
          this.eventBus.emit(Events.DEBUG_LAUNCH_WAVE);
          e.preventDefault();
          break;
        default:
          break;
      }
    };

    const onKeyUp = (e) => {
      const panDir = PAN_CODES[e.code];
      if (panDir) this.panKeysHeld[panDir] = false;
    };

    const onContextMenu = (e) => {
      const canvas = this.scene.game.canvas;
      if (e.target === canvas) e.preventDefault();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("contextmenu", onContextMenu);
    this.domHandlers.push(
      { target: window, event: "keydown", handler: onKeyDown },
      { target: window, event: "keyup", handler: onKeyUp },
      { target: window, event: "contextmenu", handler: onContextMenu },
    );
  }

  // -- helpers -----------------------------------------------------------------

  _stepZoom(factor) {
    if (!this.mapSystem) return;
    const ms = this.mapSystem;
    const nextZoom = Phaser.Math.Clamp(
      ms.zoomLevel * factor,
      ms.minZoomLevel,
      ms.maxZoomLevel,
    );
    ms.applyZoomAtScreenPoint(
      nextZoom,
      this.viewportWidth / 2,
      this.viewportHeight / 2,
      this.viewportWidth,
      this.viewportHeight,
    );
  }

  _clickDomButton(id) {
    const el = document.getElementById(id);
    if (el) el.click();
  }

  _isTypingInInput(e) {
    const tag = e.target?.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
  }

  _applyCursor() {
    const canvas = this.scene.game.canvas;
    if (canvas) canvas.style.cursor = "crosshair";
  }

  destroy() {
    this.phaserHandlers.forEach(({ eventName, handler }) => {
      this.scene.input.off(eventName, handler);
    });
    this.phaserHandlers = [];

    this.domHandlers.forEach(({ target, event, handler }) => {
      target.removeEventListener(event, handler);
    });
    this.domHandlers = [];

    this.panKeysHeld = { up: false, down: false, left: false, right: false };
  }
}
