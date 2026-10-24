// TypeScript sample: interfaces, generics, decorators, utility types, satisfies
'use strict';

import type { Config } from './config.js';
import { EventEmitter } from 'node:events';

export const enum Kind {
  Point = 'point',
  Circle = 'circle',
}

export type Serialized = { kind: Kind; payload: string };
export type Handler<T> = (value: T) => void | Promise<void>;
export type DeepReadonly<T> = T extends (infer R)[]
  ? readonly DeepReadonly<R>[]
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;

export interface Shape {
  readonly kind: Kind;
  area(): number;
  perimeter?(): number;
}

export abstract class BaseShape extends EventEmitter implements Shape {
  protected constructor(public readonly id: string) {
    super();
  }

  abstract area(): number;

  describe(): string {
    return `${this.constructor.name}#${this.id}`;
  }
}

export class Circle extends BaseShape {
  #radius: number;

  constructor(id: string, radius: number, private tag?: string) {
    super(id);
    this.#radius = radius;
  }

  get radius(): number {
    return this.#radius;
  }

  override area(): number {
    return Math.PI * this.#radius ** 2;
  }

  static isCircle(shape: Shape): shape is Circle {
    return shape.kind === Kind.Circle;
  }
}

export interface Point {
  x: number;
  y: number;
}

export interface Vec3 extends Point {
  z?: number;
  label: string;
}

type Partial-ish = Partial<Vec3> & Required<Pick<Vec3, 'x' | 'y'>>;
declare module './config.js' {
  interface Config {
    strict?: boolean;
  }
}

export function distance<const T extends ReadonlyArray<number>>(points: T): number {
  let total = 0;
  for (const p of points satisfies ReadonlyArray<number>) {
    total += Math.abs(p);
  }
  return total;
}

export function firstOrNull<T, U extends T = T>(items: readonly T[], predicate?: (item: T) => item is U): U | null {
  for (const item of items) {
    if (!predicate || predicate(item)) return item as U;
  }
  return null;
}

export async function loadShapes(config: Config): Promise<readonly Shape[]> {
  const raw: unknown = await Promise.resolve(config.payload);
  if (typeof raw !== 'string') throw new TypeError('payload must be string');

  const shapes: DeepReadonly<Shape[]> = Object.freeze([
    new Circle('c1', 2.5),
    { kind: Kind.Point, area: () => 0x0 },
  ] as const) as DeepReadonly<Shape[]>;

  shapes.forEach((shape) => {
    if (Circle.isCircle(shape as Shape)) {
      console.log(`circle ${shape.radius}`);
    } else {
      shape.area();
    }
  });

  const lookup: Record<string, number | undefined> = { a: 1 };
  const value = lookup['b'] ?? -1;
  const boxed = <T,>(value: T) => [value] as const;

  return shapes as readonly Shape[];
}

export { Point, Vec3 };
export * from './utils.js';
export = { distance };
