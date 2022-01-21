import { fabric } from 'fabric';
import { Vector } from '../../util/vector';

type LinePoints = [number, number, number, number];

type CreateBeamFunction = {
    (points: LinePoints, options?: fabric.ILineOptions): fabric.Line;
    (vi: Vector, vj: Vector, options?: fabric.ILineOptions): fabric.Line;
};

const createBeamByVectors = (vi: Vector, vj: Vector, options: fabric.ILineOptions): fabric.Line => {
    const beam = new fabric.Line([vi.x, vi.y, vj.x, vj.y], {
        stroke: 'black',
        strokeWidth: 3,
        ...options,
    });
    return beam;
};

const createBeamByPoints = (points: LinePoints, options: fabric.ILineOptions): fabric.Line => {
    const beam = new fabric.Line(points, {
        stroke: 'black',
        strokeWidth: 3,
        ...options,
    });
    return beam;
};

export const createBeam: CreateBeamFunction = (
    arg1: LinePoints | Vector,
    arg2?: Vector | fabric.ILineOptions,
    arg3?: fabric.ILineOptions
) => {
    if (Array.isArray(arg1)) {
        return createBeamByPoints(arg1, (arg2 as fabric.ILineOptions) ?? {});
    } else if (arg2) {
        return createBeamByVectors(arg1, arg2 as Vector, arg3 ?? {});
    }
    throw new Error('invalid parameters');
};
