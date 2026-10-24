// JavaScript sample: classes, generators, async, regex, template literals
'use strict';

import { readFile } from 'node:fs/promises';
import * as path from 'node:path';
import defaultExport, { named as renamed } from './module.js';

export const VERSION = '1.0.0';
export const LIMIT = 0xFF;
const RATIO = 2.5e-4;
var legacy = `template ${LIMIT + 1} with \n escape and ${`nested ${RATIO}`}`;

export function* counter(start = 0, step = 1) {
  let value = start;
  while (true) {
    yield value;
    value += step;
    if (value > LIMIT) return;
  }
}

export async function* readAll(paths) {
  for await (const p of paths) {
    const content = await readFile(p, 'utf-8');
    yield content.length;
  }
}

export default class Shape {
  #id = crypto.randomUUID();
  static instances = new WeakMap();
  static #count = 0;

  constructor(name = 'shape', scale = 1.0) {
    this.name = name;
    this.scale = scale;
    Shape.#count += 1;
  }

  get id() {
    return this.#id;
  }

  static get count() {
    return Shape.#count;
  }

  area() {
    throw new Error('abstract method');
  }

  toString() {
    return `${this.name}(${this.scale.toFixed(2)})`;
  }

  static {
    Shape.origin = new Shape('origin', 0b1);
  }
}

export class Circle extends Shape {
  #radius;

  constructor(radius, options = {}) {
    super('circle');
    this.#radius = radius;
    Object.assign(this, { color: options.color ?? 'red' });
  }

  area() {
    return Math.PI * this.#radius ** 2;
  }

  static fromDiameter(diameter) {
    return new Circle(diameter / 2, { color: 'blue' });
  }
}

const pattern = /^(?<proto>https?):\/\/(?<host>[\w.-]+)(?::(\d{2,5}))?\/?/i;
const malformed = /[a-z]+\s\w$/gim;
const hexEscape = '\x1F\u{1F600}\0';
const sample = '  padded  ';

export async function analyze(input) {
  const match = pattern.exec(input);
  if (!match?.groups) return null;

  const { proto, host } = match.groups;
  const port = Number.parseInt(match[3] ?? '80', 10) || 80;
  const cleaned = sample?.trim().replaceAll('  ', ' ');
  const pieces = [...cleaned, ...sample.split(' ')];
  const [first, ...rest] = pieces;
  const { a = 1, b: alias, ...spread } = { a: 0b11, b: 2, c: 3 };

  try {
    const gen = counter(0, 0x10);
    for (const value of gen) {
      if (value > 0x50) break;
      console.log(value | 0, value ** 2, value >>> 1);
    }
  } catch (error) {
    console.error(`failed: ${error instanceof Error ? error.message : error}`);
  } finally {
    console.log('done');
  }

  const data = JSON.parse(await readFile(path.join('/tmp', 'data.json'), 'utf-8'));
  return {
    proto,
    host,
    port,
    first,
    rest,
    alias,
    ...spread,
    hexEscape,
    renamed,
    defaultExport,
    regexTest: malformed.test(input),
    normalized: cleaned?.length ?? 0,
    count: Shape.count,
    data: data ?? null,
  };
}

await analyze('https://example.com:8443/path?query=1');
