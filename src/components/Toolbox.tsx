import {
    Box,
    FormControl,
    FormControlLabel,
    FormLabel,
    Radio,
    RadioGroup,
    Slider,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { ChangeEvent, Dispatch, SetStateAction, useCallback, useContext } from 'react';
import { CanvasContext } from '../providers/CanvasProvider';
import { CanvasMode, CanvasModes, isCanvasMode } from '../types/common';

interface Props {
    mode: CanvasMode;
    setMode: Dispatch<SetStateAction<CanvasMode>>;
    strokeWidth: number;
    setStrokeWidth: Dispatch<SetStateAction<number>>;
    strokeColor: string;
    setStrokeColor: Dispatch<SetStateAction<string>>;
}

const Toolbox: React.VFC<Props> = ({
    mode,
    strokeWidth,
    strokeColor,
    setMode,
    setStrokeColor,
    setStrokeWidth,
}) => {
    const handleChangeMode = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            const { value } = event.target;
            if (isCanvasMode(value)) {
                setMode(value);
            }
        },
        [setMode]
    );

    const handleChangeWidth = useCallback(
        (_: Event, value: number | number[]) => {
            if (typeof value === 'number') {
                setStrokeWidth(value);
            }
        },
        [setStrokeWidth]
    );

    const handleChangeColor = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            const { value } = event.target;
            setStrokeColor(value);
        },
        [setStrokeColor]
    );

    return (
        <Stack sx={{ width: 160 }} direction="column" spacing={2}>
            {/* canvasMode */}
            <FormControl component="fieldset">
                <FormLabel component="legend">
                    <RadioGroup name="canvas-mode" value={mode} onChange={handleChangeMode}>
                        {CanvasModes.map((item) => (
                            <FormControlLabel
                                key={`radio_mode_${item}`}
                                value={item}
                                label={item}
                                control={<Radio />}
                            />
                        ))}
                    </RadioGroup>
                </FormLabel>
            </FormControl>
            {/* strokeWidth */}
            <Typography variant="caption">ペンの太さ</Typography>
            <Box sx={{ width: 160, px: 1 }}>
                <Slider value={strokeWidth} onChange={handleChangeWidth} min={1} max={60} />
            </Box>
            {/* strokeColor */}
            <TextField
                type="color"
                label="ペンの色"
                fullWidth
                value={strokeColor}
                onChange={handleChangeColor}
            />
        </Stack>
    );
};

const ConnectedToolbox: React.VFC = () => {
    const context = useContext(CanvasContext);
    return <Toolbox {...context} />;
};

export default ConnectedToolbox;
