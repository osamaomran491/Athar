// robotsData.js — single robot + museum floor plan (taken from the_Ground.pdf, viewBox 1345×896)
export const ROBOT = { id: 1, name: "RoboGuide 01" };

export const liveStatusLabels = {
  tour: "On Tour",
  paused: "Paused",
  returning: "Heading to Charge",
  charging: "Charging",
};

// Walls exactly as drawn in the PDF
export const WALLS = "M108,885 L108,522 L190,422 L540,422 L608,357 L935,355 L1005,432 L1004,828";
export const WALL_BOTTOM = "M855,830 L1143,833";
// grey squares in the PDF (exhibit Monuments) and black rectangles (artifact showcases)
export const Monuments = [
  { x: 168, y: 103, w: 168, h: 168, label: "Monument III" },
  { x: 651, y: 45, w: 168, h: 168, label: "Monument II" },
  { x: 1127, y: 393, w: 168, h: 168, label: "Monument I" },
];
export const SHOWCASES = [
  { x: 418, y: 359, w: 51, h: 34 },
  { x: 770, y: 299, w: 51, h: 34 },
  { x: 1044, y: 637, w: 34, h: 51 },
];

// Robot route (loop inside the Monument). Starts at the charging dock on the RIGHT and goes toward the LEFT.
export const ROUTE = [
  { x: 955, y: 790, dock: true },
  { x: 955, y: 475 }, { x: 900, y: 418 }, { x: 630, y: 418 },
  { x: 560, y: 485 }, { x: 240, y: 485 }, { x: 170, y: 560 }, { x: 170, y: 790 },
];

// where the robot stops for a moment (next to each artifact showcase)
export const STOPS = [{ x: 955, y: 662 }, { x: 796, y: 418 }, { x: 443, y: 485 }];
export const STOP_SECONDS = 4;
