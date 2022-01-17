import { Box } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import Fabric from './Fabric';

type DOMRect = { width: number; height: number };

const Canvas: React.VFC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    // 表示領域
    const [view, setView] = useState<DOMRect>({ width: 0, height: 0 });

    useEffect(() => {
        const observer = new ResizeObserver((entries) => {
            const { width, height } = entries[0].contentRect;
            setView({
                width,
                height,
            });
        });

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => {
            observer.disconnect();
        };
    }, []);

    return (
        <Box
            ref={containerRef}
            sx={{
                flex: 1,
                m: 1,
                width: 'auto',
                height: '98%',
                overscrollBehavior: 'contain',
                overflow: 'hidden',
                border: '1px solid #ccc',
                borderRadius: 1,
            }}
        >
            <Fabric {...view} />
        </Box>
    );
};

export default Canvas;
