export interface IOverlayDescriptor {
  position: {
    bottom?: number,
    right?: number,
    top?: number,
    left?: number,
  };
  html: string;
  // configure scale=false to use non-scaling overlays
  // configure scale={ min: 1 } to use non-shrinking overlays
  scale?: false | { min: 1 };
  // configure show={ minZoom: 0.6 } to hide overlays at low zoom levels
  show?: { minZoom: number };

    /* uncomment to configure defaults for all overlays (Viewer Constructor)
  overlays: {
    defaults: {
      show: { minZoom: 1 },
      scale: true
    }
  }
  */
}
