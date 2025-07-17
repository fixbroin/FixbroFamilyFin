"use client";

import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { Mic, X } from 'lucide-react';
import { Button } from './button';

interface ListeningIndicatorProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ListeningIndicator({ isOpen, onClose }: ListeningIndicatorProps) {
    const [isBrowser, setIsBrowser] = useState(false);

    useEffect(() => {
        setIsBrowser(true);
    }, []);

    if (!isBrowser || !isOpen) {
        return null;
    }

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center animate-in fade-in-0 duration-300">
            <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="absolute top-4 right-4 h-12 w-12 rounded-full"
            >
                <X className="h-8 w-8" />
                <span className="sr-only">Close</span>
            </Button>
            <div className="flex flex-col items-center gap-6 text-foreground">
                 <div className="relative flex items-center justify-center h-40 w-40">
                    <div className="absolute h-full w-full bg-primary/20 rounded-full animate-ping"></div>
                    <div className="relative bg-primary p-8 rounded-full shadow-lg">
                        <Mic className="h-16 w-16 text-primary-foreground" />
                    </div>
                </div>
                <p className="text-2xl font-semibold animate-pulse">Listening...</p>
            </div>
        </div>,
        document.body
    );
}
