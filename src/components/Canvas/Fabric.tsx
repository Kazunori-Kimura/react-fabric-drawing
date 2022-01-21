import { fabric } from 'fabric';
import { useCallback, useContext, useEffect, useRef } from 'react';
import { CanvasContext, ICanvasContext } from '../../providers/CanvasProvider';
import { CanvasSize } from '../../types/common';
import { lerp, Vector, verticalNormalizeVector } from '../../util/vector';
import { createArrow } from '../factory/arrow';
import { createBeam } from '../factory/beam';
import { createGuideLine } from '../factory/guide';
import { createNode } from '../factory/node';
import { createTrapezoid } from '../factory/trapezoid';

type Props = CanvasSize & ICanvasContext;

interface Position {
    x: number;
    y: number;
}

// パンの範囲を A4横 に制限する
const MaxPageWidth = 2970;
const MaxPageHeight = 2100;

// 長押し
const LongPressInterval = 1000;

const Fabric: React.VFC<Props> = ({ width, height, mode, strokeWidth, strokeColor }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricRef = useRef<fabric.Canvas>();

    const enablePan = useRef(false);
    const isDragging = useRef(false);
    const lastPos = useRef<Position>({ x: 0, y: 0 });
    const longpressTimer = useRef<NodeJS.Timer>();

    useEffect(() => {
        if (canvasRef.current) {
            const canvas = new fabric.Canvas(canvasRef.current, {
                // 複数選択の可否
                selection: true,
                isDrawingMode: false,
            });

            // マウス操作
            // http://fabricjs.com/fabric-intro-part-5
            canvas.on('mouse:down', (event: fabric.IEvent<MouseEvent | TouchEvent>) => {
                if (enablePan.current) {
                    let x = 0;
                    let y = 0;
                    if (event.e.type === 'touchstart') {
                        const { touches } = event.e as TouchEvent;
                        const { clientX, clientY } = touches[0];
                        x = clientX;
                        y = clientY;
                    } else {
                        const { clientX, clientY } = event.e as MouseEvent;
                        x = clientX;
                        y = clientY;
                    }
                    // ドラッグ開始
                    canvas.selection = false; // 選択範囲の矩形を出さない
                    isDragging.current = true;
                    lastPos.current = {
                        x,
                        y,
                    };
                }
            });
            canvas.on('mouse:move', (event: fabric.IEvent<MouseEvent | TouchEvent>) => {
                if (isDragging.current) {
                    let x = 0;
                    let y = 0;
                    if (event.e.type === 'touchmove') {
                        const { touches } = event.e as TouchEvent;
                        const { clientX, clientY } = touches[0];
                        x = clientX;
                        y = clientY;
                    } else {
                        const { clientX, clientY } = event.e as MouseEvent;
                        x = clientX;
                        y = clientY;
                    }
                    const viewPort = canvas.viewportTransform;
                    const zoom = canvas.getZoom();
                    const canvasWidth = canvas.getWidth();
                    const canvasHeight = canvas.getHeight();
                    if (viewPort) {
                        let px = viewPort[4];
                        let py = viewPort[5];

                        // ページ幅がキャンバス幅に収まる
                        if (canvasWidth >= MaxPageWidth * zoom) {
                            px = canvasWidth / 2 - (MaxPageWidth * zoom) / 2;
                        } else {
                            px += x - lastPos.current.x;
                            if (px >= 0) {
                                px = 0;
                            } else if (px < canvasWidth - MaxPageWidth * zoom) {
                                px = canvasWidth - MaxPageWidth * zoom;
                            }
                        }
                        // ページ高がキャンバス高に収まる
                        if (canvasHeight >= MaxPageHeight * zoom) {
                            py = canvasHeight / 2 - (MaxPageHeight * zoom) / 2;
                        } else {
                            py += y - lastPos.current.y;
                            if (py >= 0) {
                                py = 0;
                            } else if (py < canvasHeight - MaxPageHeight * zoom) {
                                py = canvasHeight - MaxPageHeight * zoom;
                            }
                        }

                        viewPort[4] = px;
                        viewPort[5] = py;

                        canvas.requestRenderAll();
                    }

                    lastPos.current = {
                        x,
                        y,
                    };
                }
            });
            canvas.on('mouse:up', () => {
                const viewPort = canvas.viewportTransform;
                if (viewPort) {
                    canvas.setViewportTransform(viewPort);
                }
                // ドラッグ終了
                isDragging.current = false;
                canvas.selection = true;
            });

            canvas.on('selection:created', (event: fabric.IEvent<Event>) => {
                console.log('selection:created: ', event);
            });
            canvas.on('selection:updated', (event: fabric.IEvent<Event>) => {
                console.log('selection:updated: ', event);
            });
            canvas.on('mouse:dblclick', (event: fabric.IEvent<Event>) => {
                console.log('mouse:dblclick: ', event);
            });
            canvas.on('touch:longpress', (event: fabric.IEvent<Event>) => {
                console.log('touch:longpress: ', event);
            });

            // グリッドの描画
            // TODO: 消しゴムで消えないようにする
            const defaultGridLineProps: fabric.ILineOptions = {
                stroke: '#eee',
                strokeWidth: 1,
                // イベントに反応させない
                evented: false,
                hasControls: false,
                selectable: false,
                // 出力対象外
                excludeFromExport: true,
                data: {
                    type: 'background',
                    excludeExport: true,
                },
            };

            for (let y = 0; y <= MaxPageHeight; y += 25) {
                const hl = new fabric.Line([0, y, MaxPageWidth, y], { ...defaultGridLineProps });
                canvas.add(hl);
            }
            for (let x = 0; x <= MaxPageWidth; x += 25) {
                const vl = new fabric.Line([x, 0, x, MaxPageHeight], { ...defaultGridLineProps });
                canvas.add(vl);
            }

            // テスト的に 3つの長方形を表示する
            const RectSize = { width: 160, height: 90 } as const;
            const Interval = 25;
            ['red' /*'blue', 'green'*/].forEach((color, index) => {
                const rect = new fabric.Rect({
                    left: 100 + (Interval + RectSize.width) * index,
                    top: 100 + (Interval + RectSize.height) * index,
                    ...RectSize,
                    name: `Rect_${index}`,
                    data: { type: 'rect', index, color },
                    lockRotation: true,
                    fill: color,
                });

                rect.on('mousedown:before', (event: fabric.IEvent<Event>) => {
                    console.log('Rect#mousedown:before: ', event);
                });
                rect.on('mousedown', (event: fabric.IEvent<Event>) => {
                    console.log('Rect#mousedown: ', event);
                    if (longpressTimer.current) {
                        clearTimeout(longpressTimer.current);
                        longpressTimer.current = undefined;
                    }

                    // 現在位置を保持する
                    const { top: beforeTop, left: beforLeft } = rect.getBoundingRect(true, true);

                    longpressTimer.current = setTimeout(() => {
                        // 現在位置を取得
                        const { top: afterTop, left: afterLeft } = rect.getBoundingRect(true, true);
                        // mousedown 直後と位置が変わっていなければ longtap とする
                        if (beforeTop === afterTop && beforLeft === afterLeft) {
                            // longpress
                            console.log('Rect#longpress', event);
                        }
                        longpressTimer.current = undefined;
                    }, LongPressInterval);
                });
                rect.on('mouseup', (event: fabric.IEvent<Event>) => {
                    console.log('Rect#mouseup: ', event);
                    if (longpressTimer.current) {
                        clearTimeout(longpressTimer.current);
                        longpressTimer.current = undefined;
                    }
                });
                rect.on('modified', (event: fabric.IEvent<Event>) => {
                    console.log('Rect#modified: ', event);
                });

                canvas.add(rect);
            });

            // 梁要素
            const vi = new Vector(150, 500);
            const vj = new Vector(250, 400);
            const beam = createBeam(vi, vj);
            canvas.add(beam);

            // 集中荷重的なもの
            const forceDir = verticalNormalizeVector(vi, vj);
            const forceLength = 90;
            const forceHead = lerp(vi, vj, 0.3);
            const forceTail = forceHead.clone().add(forceDir.clone().multiplyScalar(forceLength));

            const force = createArrow(forceHead, forceTail, {
                arrowEdgeSize: 12,
                arrowWidth: 3,
                fill: 'orange',
            });
            force.setControlsVisibility({
                bl: false,
                br: false,
                mb: false,
                ml: false,
                mr: false,
                mt: true,
                tl: false,
                tr: false,
                mtr: true,
            });

            const beamDir = vj.clone().subtract(vi).normalize();
            const lp = forceHead.clone().add(beamDir.clone().multiplyScalar(6));

            const forceLabel = new fabric.Textbox('  10 kN', {
                top: lp.y,
                left: lp.x,
                fill: 'orange',
                fontSize: 10,
                fontFamily: 'sans-serif',
                width: forceLength,
                textAlign: 'left',
                angle: forceDir.angleDeg(),
                evented: false,
                selectable: false,
            });

            canvas.add(force);
            canvas.add(forceLabel);

            // 補助線の描画
            const data: [number, number, number, number][] = [
                // 縦
                [400, 100, 400, 200],
                // 横
                [500, 100, 700, 100],
                // 右下がり
                [600, 200, 800, 300],
                // 右上がり
                [600, 600, 800, 400],
            ];

            data.forEach((points) => {
                const guide = createGuideLine(points);
                canvas.add(guide);
            });

            // 節点的なもの
            const node1 = createNode(vi.x, vi.y);
            const node2 = createNode(vj.x, vj.y);
            const node3 = createNode(400, 450);
            canvas.add(node1, node2, node3);

            const beamPoints: [number, number, number, number] = [250, 400, 400, 450];
            const beam2 = createBeam(beamPoints);
            canvas.add(beam2);

            // 分布荷重的なもの
            const trapezoid = createTrapezoid(beamPoints, 11, 10, 12, 0.2, 0.3, 90, true);
            canvas.add(trapezoid);

            fabricRef.current = canvas;
        }
    }, []);

    // キャンバスサイズの変更
    useEffect(() => {
        if (fabricRef.current) {
            fabricRef.current.setDimensions({
                width,
                height,
            });
        }
    }, [width, height]);

    // ペンの変更
    const setBrush = useCallback((color: string, width: number) => {
        if (fabricRef.current) {
            let brush = fabricRef.current.freeDrawingBrush;
            if (!Boolean(brush)) {
                brush = new fabric.PencilBrush(fabricRef.current);
                fabricRef.current.freeDrawingBrush = brush;
            }

            brush.color = color;
            brush.width = width;
        }
    }, []);

    // モード切替/ペンの変更
    useEffect(() => {
        if (fabricRef.current) {
            let isDrawingMode = false;
            let pannable = false;
            if (mode === 'draw') {
                isDrawingMode = true;
                setBrush(strokeColor, strokeWidth);
            } else if (mode === 'pan') {
                pannable = true;
            }
            fabricRef.current.isDrawingMode = isDrawingMode;
            enablePan.current = pannable;
        }
    }, [mode, setBrush, strokeColor, strokeWidth]);

    return <canvas ref={canvasRef} width={width} height={height} />;
};

const ConnectedFabric: React.VFC<CanvasSize> = (props) => {
    const context = useContext(CanvasContext);
    return <Fabric {...context} {...props} />;
};

export default ConnectedFabric;
