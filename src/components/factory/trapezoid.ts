import { fabric } from 'fabric';
import { getInsidePoints, intercectPoint, Vector, vX } from '../../util/vector';
import { createArrow, CreateArrowOptions } from './arrow';

type LinePoints = [number, number, number, number];

type CreateTrapezoidFunction = (
    beam: LinePoints,
    // 平均値
    forceAverage: number,
    // kN/m
    forceI: number,
    // kN/m
    forceJ: number,
    // i端からの距離 (0 〜 1, distanceI + distanceJ <= 1)
    distanceI: number,
    // j端からの距離 (0 〜 1, distanceI + distanceJ <= 1)
    distanceJ: number,
    // 角度、デフォルト 90度、-179 〜 180 度の間で指定 (-180 = 180)
    angle?: number,
    // 全体座標系に垂直か、部材に垂直か デフォルト false
    isGlobal?: boolean
) => fabric.Group;

const TrapezoidColor = 'pink';
const defaultTrapezoidArrowOptions: CreateArrowOptions = {
    fill: TrapezoidColor,
    arrowWidth: 2,
    arrowEdgeSize: 8,
};
const defaultTrapezoidLineOptions: fabric.ILineOptions = {
    stroke: TrapezoidColor,
    strokeWidth: 2,
};
const defaultTrapezoidLabelOptions: fabric.ITextboxOptions = {
    fill: TrapezoidColor,
    fontSize: 10,
    fontFamily: 'sans-serif',
    height: 10,
    selectable: false,
    evented: false,
};

/**
 * 分布荷重の矢印の長さ
 */
const TrapezoidArrowBaseLength = 30;

const calcLength = (force: number, ave: number): number => {
    if (isNaN(ave) || ave === 0) {
        return TrapezoidArrowBaseLength;
    }
    return (force / ave) * TrapezoidArrowBaseLength;
};

const createTrapezoidLabel = (label: string, position: Vector, angle: number): fabric.Textbox => {
    return new fabric.Textbox(label, {
        ...defaultTrapezoidLabelOptions,
        top: position.y,
        left: position.x,
        angle,
        width: 140,
    });
};

/**
 * 分布荷重の生成
 * @param beam
 * @param forceAverage
 * @param forceI
 * @param forceJ
 * @param distanceI
 * @param distanceJ
 * @param angle
 * @param isGlobal
 * @returns
 */
export const createTrapezoid: CreateTrapezoidFunction = (
    beam,
    forceAverage,
    forceI,
    forceJ,
    distanceI,
    distanceJ,
    angle = 90,
    isGlobal = false
): fabric.Group => {
    const vI = new Vector(beam[0], beam[1]);
    const vJ = new Vector(beam[2], beam[3]);

    // 梁要素の方向
    const beamDir = vJ.clone().subtract(vI).normalize();
    // 分布荷重の方向
    let dir: Vector;
    if (isGlobal) {
        dir = vX
            .clone()
            .rotateDeg(angle * -1)
            .normalize();
    } else {
        dir = beamDir
            .clone()
            .rotateDeg(angle * -1)
            .normalize();
    }
    // 梁要素の長さ
    const beamLength = vI.distance(vJ);
    // 分布荷重の下端の位置
    const bi = vI.clone().add(beamDir.clone().multiplyScalar(beamLength * distanceI));
    const bj = vI.clone().add(beamDir.clone().multiplyScalar(beamLength * (1 - distanceJ)));
    // 分布荷重の上端の位置
    const pi = bi.clone().add(dir.clone().multiplyScalar(calcLength(forceI, forceAverage)));
    const pj = bj.clone().add(dir.clone().multiplyScalar(calcLength(forceJ, forceAverage)));

    // 下端を等間隔に分割する点を取得
    const points = getInsidePoints(bi, bj, beamDir);
    // 上端の傾き
    const slope = pj.x - pi.x !== 0 ? (pj.y - pi.y) / (pj.x - pi.x) : NaN;
    // 上端の切片
    const intercept = isNaN(slope) ? NaN : pi.y - slope * pi.x;

    // 内側の矢印
    const insideArrows: LinePoints[] = [];
    points.forEach((point) => {
        // 下端の点から上端に線を伸ばして交差する点
        const pu = intercectPoint([pi, pj, slope, intercept], point, dir);
        if (pu) {
            const arrow: LinePoints = [point.x, point.y, pu[0], pu[1]];
            insideArrows.push(arrow);
        }
    });

    // 矢印
    const arrows: LinePoints[] = [
        // 左端
        [bi.x, bi.y, pi.x, pi.y],
        // 内側の矢印
        ...insideArrows,
        // 右端
        [bj.x, bj.y, pj.x, pj.y],
    ];
    const shapes = arrows.map((arrow) => {
        const shape = createArrow(arrow, defaultTrapezoidArrowOptions);
        return shape;
    });

    // 上端
    const line = new fabric.Line([pi.x, pi.y, pj.x, pj.y], {
        ...defaultTrapezoidLineOptions,
    });

    // i端側ラベル
    const li = bi.clone().add(beamDir.clone().multiplyScalar(5));
    // j端側ラベル
    const lj = bj.clone().add(beamDir.clone().multiplyScalar(5));
    // ラベルの角度
    const labelAngle = dir.angleDeg();

    const labelI = createTrapezoidLabel(`  ${forceI} kN/m`, li, labelAngle);
    const labelJ = createTrapezoidLabel(`  ${forceJ} kN/m`, lj, labelAngle);

    const group = new fabric.Group([labelI, labelJ, line, ...shapes]);
    return group;
};
