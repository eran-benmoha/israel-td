export const Events = {
  DEBUG_LAUNCH_WAVE: "debug/launch-wave",
  SHOP_PURCHASE_UNIT: "shop/purchase-unit",
  UI_WAVE: "ui/wave",
  UI_RESOURCES: "ui/resources",
  UI_SHOP_CATALOG: "ui/shop-catalog",
  UI_SHOP_STATE: "ui/shop-state",
  UI_SHOP_RESULT: "ui/shop-result",
  UI_DEBUG_STATUS: "ui/debug-status",
  UI_DEBUG_ZOOM: "ui/debug-zoom",
} as const;

export type EventName = (typeof Events)[keyof typeof Events];
