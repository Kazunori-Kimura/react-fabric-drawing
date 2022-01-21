import { fabric } from 'fabric';
import { Vector } from '../../util/vector';

type Point = { x: number; y: number };
type LinePoints = [number, number, number, number];

interface ArrowOptions {
    arrowWidth?: number;
    arrowEdgeSize?: number;
}

/**
 * 矢印形状の頂点座標（↓）
 * @param length
 * @param width
 * @param edgeSize
 * @returns
 */
export const createArrowShape = (length: number, width: number, edgeSize: number): Point[] => {
    return [
        { x: edgeSize / 2 - width / 2, y: 0 },
        { x: edgeSize / 2 - width / 2, y: length - edgeSize },
        { x: 0, y: length - edgeSize },
        { x: edgeSize / 2, y: length },
        { x: edgeSize, y: length - edgeSize },
        { x: edgeSize / 2 + width / 2, y: length - edgeSize },
        { x: edgeSize / 2 + width / 2, y: 0 },
    ];
};

export type CreateArrowOptions = ArrowOptions & fabric.IObjectOptions;

type CreateArrowFunction = {
    (points: LinePoints, options: CreateArrowOptions): fabric.Polygon;
    (vi: Vector, vj: Vector, options: CreateArrowOptions): fabric.Polygon;
};

const createArrowByVectors = (
    vi: Vector,
    vj: Vector,
    { arrowWidth = 3, arrowEdgeSize = 12, ...options }: CreateArrowOptions
): fabric.Polygon => {
    // 矢印の方向
    const dir = vj.clone().subtract(vi).normalize();
    // 角度
    // (createArrowShape で生成される矢印が下方向なので +90 して X方向に向かせる)
    const angle = dir.angleDeg() + 90;
    // 長さ
    const length = vi.distance(vj);
    // 頂点座標
    const points = createArrowShape(length, arrowWidth, arrowEdgeSize);

    // Polygon 生成
    const arrow = new fabric.Polygon(points, {
        top: vi.y,
        left: vi.x,
        angle,
        // 矢印の先端を基準に回転させる
        originX: 'center',
        originY: 'bottom',
        centeredRotation: false,
        ...options,
    });

    return arrow;
};

const createArrowByPoints = (points: LinePoints, options: CreateArrowOptions): fabric.Polygon => {
    const p1 = new Vector(points[0], points[1]);
    const p2 = new Vector(points[2], points[3]);
    return createArrowByVectors(p1, p2, options);
};

/**
 * 矢印を生成する
 * @param arg1
 * @param arg2
 * @param arg3
 * @returns
 */
export const createArrow: CreateArrowFunction = (
    arg1: LinePoints | Vector,
    arg2: Vector | CreateArrowOptions,
    arg3?: CreateArrowOptions
): fabric.Polygon => {
    if (Array.isArray(arg1)) {
        return createArrowByPoints(arg1, arg2 as CreateArrowOptions);
    } else if (arg3) {
        return createArrowByVectors(arg1, arg2 as Vector, arg3);
    }
    throw new Error('invalid parameters');
};
