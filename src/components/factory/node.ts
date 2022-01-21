import { fabric } from 'fabric';

export const createNode = (
    x: number,
    y: number,
    options: fabric.ICircleOptions = {}
): fabric.Circle => {
    const circle = new fabric.Circle({
        top: y,
        left: x,
        radius: 5,
        fill: 'black',
        originX: 'center',
        originY: 'center',
        // 選択してもコントロールを表示しない
        hasBorders: false,
        hasControls: false,
        ...options,
    });
    return circle;
};
