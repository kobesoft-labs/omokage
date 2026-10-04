// Declarative use: avatars straight from HTML attributes.
//
//   <span data-omokage="animals" data-seed="tanaka" style="width:48px"></span>
//   <span data-omokage="yokai" data-config='{"body":"kasa"}'></span>
//
// Attributes: data-omokage (style key), data-seed or data-config (JSON), data-hue.
// The SVG fills its element; give the element a size.

/** Renders `avatar` into `el`, replacing its content. */
export function mount(el, avatar, options = {}, { render }) {
  el.innerHTML = render(avatar, options).replace("<svg ", '<svg width="100%" height="100%" role="img" aria-label="avatar" ');
  return el;
}

/** Renders every [data-omokage] element under `root`. */
export function mountAll(root, api) {
  const nodes = (root || document).querySelectorAll("[data-omokage]");
  for (const el of nodes) {
    const style = el.dataset.omokage || "officers";
    const hue = el.dataset.hue !== undefined ? Number(el.dataset.hue) : undefined;
    const avatar = el.dataset.config
      ? { style, config: JSON.parse(el.dataset.config) }
      : api.random(el.dataset.seed || el.textContent.trim() || "omokage", { style });
    mount(el, avatar, { hue }, api);
  }
  return nodes.length;
}
