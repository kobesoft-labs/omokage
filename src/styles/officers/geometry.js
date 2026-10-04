// The shared skeleton of every officer. Canvas 200 x 200, centered on x = 100.

export const INK = "#2b2233";

// Outline color and width of the silhouette outline (the visible line is half the width).
export const LINE = "#3a2d3e";
export const LINE_W = 3;

export const FACE = "M100 50 C121 50 134 64 134 88 C134 100 133 110 129 119 C123 131 112 138 100 138 C88 138 77 131 71 119 C67 110 66 100 66 88 C66 64 79 50 100 50Z";
export const EAR = "M68 92 C59 89 56 103 61 110 C63 113 67 113 69 111Z";
export const EAR_IN = "M65 97 C61 99 62 105 66 107";
export const NECK = "M88 116 L88 150 C92 156 108 156 112 150 L112 116Z";
export const NECK_SHADOW = "M88 122 C94 136 106 136 112 122 L112 138 C106 146 94 146 88 138Z";
export const BODY = "M100 148 C80 148 64 150 52 156 C36 163 28 176 26 200 L174 200 C172 176 164 163 148 156 C136 150 120 148 100 148Z";
export const BODY_SIDES = "M26 200 C28 178 36 164 50 157 C46 170 46 186 48 200Z M174 200 C172 178 164 164 150 157 C154 170 154 186 152 200Z";
/** Light comes from the upper left; this is the shade on the right cheek and jaw. */
export const FACE_SHADE = "M134 82 C135 108 124 132 100 138.4 C116 128 127 108 128.6 84Z";
/** x of the left and right eye. */
export const EYE_X = [87, 113];

/** Necklines cut out of clothing layers (see wear.js). */
export const OPEN = {
  neck:    "M88 130 L88 149 C94 152 106 152 112 149 L112 130Z",     // closed collar: only the neck shows
  crew:    "M86 130 L86 147 C90 159 110 159 114 147 L114 130Z",
  crewLow: "M84 130 L84 148 C90 163 110 163 116 148 L116 130Z",
  v:       "M87 130 L87 147 L100 168 L113 147 L113 130Z",
  collar:  "M89 130 L89 147 L100 161 L111 147 L111 130Z",           // open shirt collar
  zip:     "M90 130 L90 148 L100 160 L110 148 L110 130Z",
  vest:    "M86 130 L86 148 L100 176 L114 148 L114 130Z",
  jacket:  "M84 130 L84 147 L100 186 L116 147 L116 130Z",           // buttoned suit jacket
  front:   "M83 130 L83 147 L96 200 L104 200 L117 147 L117 130Z",  // open front: blazers, cardigans
  kimono:  "M85 130 L85 146 L100 174 L115 146 L115 130Z",
};

/**
 * Where each category may draw. Parts are clipped to their region, so nothing can
 * leak out of the face or the clothes. Parts marked `free` (a sweat drop, a monocle
 * chain) are meant to stick out and are not clipped. tools/audit.html verifies this.
 */
const CLOTH_AREA = [BODY, "M56 168 C56 116 144 116 144 168Z", "M84 116 L116 116 L116 160 L84 160Z"];
const BEARD_AREA = "M64 92 C64 132 80 156 100 164 C120 156 136 132 136 92Z";
const GLASSES_AREA = "M54 82 L146 82 L146 116 L54 116Z";
const EARRING_AREA = "M50 104 L76 104 L76 136 L50 136Z M124 104 L150 104 L150 136 L124 136Z";
export const REGIONS = {
  eyes: [FACE], brows: [FACE], nose: [FACE], mouth: [FACE], face: [FACE],
  beard: [FACE, BEARD_AREA], glasses: [FACE, GLASSES_AREA], earrings: [EARRING_AREA],
  top: CLOTH_AREA, neck: CLOTH_AREA, chest: CLOTH_AREA,
};
