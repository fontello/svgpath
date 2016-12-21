declare module "svgpath" {
  interface SvgPath {
    (path: string): SvgPath;
    new (path: string): SvgPath;
    abs(): SvgPath;
    scale(sx: number, sy?: number): SvgPath;
    translate(x: number, y?: number): SvgPath;
    rotate(angle: number, rx?: number, ry?: number): SvgPath;
    skewX(degrees: number): SvgPath;
    skewY(degrees: number): SvgPath;
    matrix(m1: number, m2: number, m3: number, m4: number, m5: number, m6: number): SvgPath;
    transform(str: string): SvgPath;
    unshort(): SvgPath;
    unarc(): SvgPath;
    toString(): String;
    round(precision: number): SvgPath;
    iterate(iterator: (segment: any[], index: number, x: number, y: number) => void, keepLazyStack?: boolean): SvgPath;
  }

  const svgPath: SvgPath;
  export = svgPath;
}
