import { fabric } from 'fabric';
import { useCallback, useContext, useEffect, useRef } from 'react';
import { CanvasContext } from '../../providers/CanvasProvider';
import { CanvasSize } from '../../types/common';

type Props = CanvasSize;

interface Position {
    x: number;
    y: number;
}

// パンの範囲を A4横 に制限する
const MaxPageWidth = 2970;
const MaxPageHeight = 2100;

const Fabric: React.VFC<Props> = ({ width, height }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricRef = useRef<fabric.Canvas>();

    const enablePan = useRef(false);
    const isDragging = useRef(false);
    const lastPos = useRef<Position>({ x: 0, y: 0 });

    const { mode, strokeWidth, strokeColor } = useContext(CanvasContext);

    useEffect(() => {
        if (canvasRef.current) {
            const canvas = new fabric.Canvas(canvasRef.current, {
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
                    // 選択を解除する
                    canvas.selection = false;
                    // ドラッグ開始
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
                canvas.selection = true;
                isDragging.current = false;
            });

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

export default Fabric;
