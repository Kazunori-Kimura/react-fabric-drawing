import { fabric } from 'fabric';
import { Vector, verticalNormalizeVector, vX, vY } from '../../util/vector';

type CreateGuideLineFunction = {
    (points: [number, number, number, number]): fabric.Group;
    (v1: Vector, v2: Vector): fabric.Group;
};

const GuideLineEdgeSize = 8;
const GuideLineColor = 'silver';
const GuideLineHeight = 14;

const defaultLineOptions: fabric.ILineOptions = {
    stroke: GuideLineColor,
    strokeWidth: 1,
};
const defaultEdgeOptions: fabric.ITriangleOptions = {
    width: GuideLineEdgeSize,
    height: GuideLineEdgeSize,
    stroke: GuideLineColor,
    strokeWidth: 1,
    fill: GuideLineColor,
    originX: 'center',
    originY: 'center',
    centeredRotation: true,
};
const defaultLabelOptions: fabric.ITextboxOptions = {
    fill: GuideLineColor,
    height: 10,
    fontSize: 10,
    fontFamily: 'sans-serif',
    textAlign: 'center',
    evented: false,
    selectable: false,
};

export const createGuideLineByVectors = (p1: Vector, p2: Vector): fabric.Group => {
    let v1 = p1;
    let v2 = p2;
    if (p1.x > p2.x || (p1.x === p2.x && p1.y > p2.y)) {
        [v1, v2] = [p2, p1];
    }

    // 距離
    const distance = v1.distance(v2);
    // 方向
    const dir = v2.clone().subtract(v1).normalize();
    const angle = dir.angleDeg();

    // |<-->| こんな感じに描く
    const verticalLineLeft = new fabric.Line(
        [0, (-1 * GuideLineHeight) / 2, 0, GuideLineHeight / 2],
        defaultLineOptions
    );
    const verticalLineRight = new fabric.Line(
        [distance, (-1 * GuideLineHeight) / 2, distance, GuideLineHeight / 2],
        defaultLineOptions
    );
    const horizontalLine = new fabric.Line([0, 0, distance, 0], defaultLineOptions);
    const edgeLeft = new fabric.Triangle({
        top: 0,
        left: GuideLineEdgeSize / 2,
        angle: -90,
        ...defaultEdgeOptions,
    });
    const edgeRight = new fabric.Triangle({
        top: 0,
        left: distance - GuideLineEdgeSize / 2,
        angle: 90,
        ...defaultEdgeOptions,
    });

    const guide = new fabric.Group(
        [verticalLineLeft, edgeLeft, horizontalLine, edgeRight, verticalLineRight],
        {
            top: v1.y,
            left: v1.x,
            originX: 'left',
            originY: 'center',
            angle,
        }
    );

    let labelAngle = angle;
    let vdir = verticalNormalizeVector(v1, v2).invert();
    let labelPosition = v1.clone().add(vdir.multiplyScalar(5));
    if (vdir.dot(vY) === 0) {
        // Y軸方向と直交する場合、下端を基準にラベルを描く
        vdir = vX.clone();
        labelAngle = -90;
        labelPosition = v2.clone().add(vdir.multiplyScalar(5));
    }

    const label = new fabric.Textbox(`${Math.round(distance)} m`, {
        top: labelPosition.y,
        left: labelPosition.x,
        width: distance,
        angle: labelAngle,
        ...defaultLabelOptions,
    });

    return new fabric.Group([guide, label], { selectable: false, evented: false });
};

export const createGuideLineByPoints = (points: [number, number, number, number]): fabric.Group => {
    const p1 = new Vector(points[0], points[1]);
    const p2 = new Vector(points[2], points[3]);
    return createGuideLineByVectors(p1, p2);
};

export const createGuideLine: CreateGuideLineFunction = (
    arg1: [number, number, number, number] | Vector,
    arg2?: Vector
): fabric.Group => {
    if (Array.isArray(arg1)) {
        return createGuideLineByPoints(arg1);
    } else if (arg2) {
        return createGuideLineByVectors(arg1, arg2);
    }
    throw new Error('invalid parameters');
};
