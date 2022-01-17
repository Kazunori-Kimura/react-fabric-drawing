import { Stack } from '@mui/material';
import React from 'react';
import Canvas from './components/Canvas';
import Toolbox from './components/Toolbox';
import CanvasProvider from './providers/CanvasProvider';

function App() {
    return (
        <CanvasProvider>
            <Stack
                direction="row"
                sx={{ width: '100%', height: '90vh', mx: 1, overflow: 'hidden' }}
            >
                <Toolbox />
                <Canvas />
            </Stack>
        </CanvasProvider>
    );
}

export default App;
