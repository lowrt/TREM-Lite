/**
 * @typedef {keyof HTMLElementTagNameMap} TagName
 */

/**
 * @typedef {Object} ElementData
 * @property {TagName} tag
 * @property {string} [id]
 * @property {string|string[]} [class]
 * @property {Record<string, string>} [attributes]
 * @property {Record<string, string>} [styles]
 */

/**
 * @class
 * @template {TagName} [T = "div"]
 */
class ElementBuilder {
  /**
	 * @constructor
	 * @param {T | {tag: T} & ElementData} [data="div"]
	 */
  constructor(data = "div") {
    if (typeof data == "string") this.element = document.createElement(data);
    else {
      this.element = document.createElement(data.tag ?? "div");

      if ("id" in data) this.element.id = data.id;

      if ("class" in data)
        if (Array.isArray(data.class))
          for (const className of data.class) this.element.classList.add(className);
        else if (typeof data.class == "string") this.element.className = data.class;

      if ("attributes" in data)
        for (const key in data.attributes) this.element.setAttribute(key, data.attributes[key]);

      if ("styles" in data)
        for (const key in data.styles) this.element.setStyle(key, data.styles[key]);
    }
  }

  /**
	 * @param {string} id
	 * @returns {this}
	 */
  setId(id) {
    this.element.id = id;
    return this;
  }

  /**
	 * @param {string|string[]} data
	 * @returns {this}
	 */
  setClass(data) {
    if (Array.isArray(data)) this.element.className = data.join(" ");
    else if (typeof data == "string") this.element.className = data;
    return this;
  }

  /**
	 * @param {string|string[]} data
	 * @returns {this}
	 */
  addClass(data) {
    if (Array.isArray(data))
      for (const className of data) this.element.classList.add(className);
    else if (typeof data == "string") this.element.classList.add(data);
    return this;
  }

  /**
	 * @param {string|string[]} data
	 * @returns {this}
	 */
  removeClass(data) {
    if (Array.isArray(data))
      for (const className of data) this.element.classList.remove(className);
    else if (typeof data == "string") this.element.classList.remove(data);
    return this;
  }

  /**
	 * @param {string|string[]} className
	 * @returns {boolean}
	 */
  hasClass(className) {
    return this.element.classList.contains(className);
  }

  /**
	 * @param {string} content
	 * @returns {this}
	 */
  setContent(content) {
    this.element.textContent = content;
    return this;
  }

  /**
	 * @param {string} key
	 * @param {string} value
	 * @returns {this}
	 */
  setAttribute(key, value) {
    this.element.setAttribute(key, value);
    return this;
  }

  /**
	 * @param {boolean} state
	 * @returns {this}
	 */
  setDisabled(state) {
    this.element.disabled = state;
    return this;
  }

  /**
	 * @param {boolean} required
	 * @returns {this}
	 */
  setRequired(required) {
    this.element.required = required;
    return this;
  }

  /**
	 * @param {string} rule
	 * @param {string} value
	 * @returns {this}
	 */
  setStyle(rule, value) {
    this.element.style[rule] = value;
    return this;
  }

  /**
	 * @param {ElementBuilder|HTMLElement|ElementBuilder[]|HTMLElement[]} children
	 * @returns {this}
	 */
  addChildren(children) {
    if (children)
      if (Array.isArray(children))
        for (const child of children)
          if (child instanceof ElementBuilder) this.element.append(child.toElement());
          else this.element.append(child);
      else if (children instanceof ElementBuilder) this.element.append(children.toElement());
      else this.element.append(children);
    return this;
  }

  /**
	 * @param {ElementBuilder|HTMLElement|ElementBuilder[]|HTMLElement[]} children
	 * @returns {this}
	 */
  setChildren(children) {
    const arr = [];
    if (children)
      if (Array.isArray(children)) {
        for (const child of children)
          if (child instanceof ElementBuilder) arr.push(child.toElement());
          else arr.push(child);
        this.element.replaceChildren(arr);
      } else if (children instanceof ElementBuilder) this.element.replaceChildren(children.toElement());
      else this.element.replaceChildren(children);
    return this;
  }

  /**
	 * @template {keyof HTMLElementEventMap} K
	 * @param {K} eventName
	 * @param {(this: HTMLElementTagNameMap[T], ev: HTMLElementEventMap[K]) => any} callback
	 * @param {...any} args
	 * @returns {this}
	 */
  on(eventName, callback, ...args) {
    this.element.addEventListener(eventName, callback.bind(this.element, ...args));
    return this;
  }

  /**
	 * @template {keyof HTMLElementEventMap} K
	 * @param {K} eventName
	 * @param {(this: HTMLElementTagNameMap[T], ev: HTMLElementEventMap[K]) => any} callback
	 * @param {...any} args
	 * @returns {this}
	 */
  once(eventName, callback, ...args) {
    this.element.addEventListener(eventName, callback.bind(this.element, ...args), { once: true });
    return this;
  }

  /**
	 * @returns {HTMLElementTagNameMap[T]}
	 */
  toElement() {
    return this.element;
  }
}

module.exports = ElementBuilder;