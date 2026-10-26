import { Button } from '@eos/shared/ui';
import { Download, X } from 'lucide-react';
import { createPortal } from 'react-dom';

type VideoViewerProps = {
    fileUrl: string;
    onClose: () => void;
    fileName: string;
};

export default function VideoViewer({
    fileUrl,
    onClose,
    fileName,
}: VideoViewerProps) {
    return createPortal(
        <div
            className="fixed inset-0 z-[100] bg-slate-900 flex flex-col h-dvh"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="h-14 bg-white border-b flex items-center justify-between px-4 shrink-0">
                <span className="font-medium">{fileName}</span>
                <div className="flex items-center gap-2">
                    <Button asChild size="icon" variant="outline">
                        <a href={fileUrl} download={fileName}>
                            <Download />
                        </a>
                    </Button>
                    <Button onClick={onClose} size="icon" variant="outline">
                        <X />
                    </Button>
                </div>
            </div>

            <div className="flex-1 bg-black flex items-center justify-center overflow-hidden">
                <video
                    controls
                    className="max-w-full max-h-full"
                    src={fileUrl}
                >
                    Your browser does not support the video tag.
                </video>
            </div>
        </div>,
        document.body,
    );
}
