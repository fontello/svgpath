declare module "svgpath" {
  interface SvgPath {
    (path: string): SvgPath;
    new (path: string): SvgPath;
    from(path: string | SvgPath): SvgPath;
    abs(): SvgPath;
    rel(): SvgPath;
    scale(sx: number, sy?: number): SvgPath;
    translate(x: number, y?: number): SvgPath;
    rotate(angle: number, rx?: number, ry?: number): SvgPath;
    skewX(degrees: number): SvgPath;
    skewY(degrees: number): SvgPath;
    matrix(m: number[]): SvgPath;
    transform(str: string): SvgPath;
    unshort(): SvgPath;
    unarc(): SvgPath;
    toString(): string;
    round(precision: number): SvgPath;
    iterate(iterator: (segment: any[], index: number, x: number, y: number) => void, keepLazyStack?: boolean): SvgPath;
  }

  const svgPath: SvgPath;
  export = svgPath;
}
