import { createContext, Dispatch, ReactNode, SetStateAction, useState } from 'react';
import { CanvasMode } from '../types/common';

interface Props {
    children: ReactNode;
}

interface ICanvasProvider {
    mode: CanvasMode;
    setMode: Dispatch<SetStateAction<CanvasMode>>;
    strokeWidth: number;
    setStrokeWidth: Dispatch<SetStateAction<number>>;
    strokeColor: string;
    setStrokeColor: Dispatch<SetStateAction<string>>;
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export const CanvasContext = createContext<ICanvasProvider>(undefined!);

const CanvasProvider: React.VFC<Props> = ({ children }) => {
    const [mode, setMode] = useState<CanvasMode>('pan');
    const [strokeWidth, setStrokeWidth] = useState<number>(3);
    const [strokeColor, setStrokeColor] = useState<string>('#000000');

    return (
        <CanvasContext.Provider
            value={{ mode, strokeColor, strokeWidth, setMode, setStrokeColor, setStrokeWidth }}
        >
            {children}
        </CanvasContext.Provider>
    );
};

export default CanvasProvider;
