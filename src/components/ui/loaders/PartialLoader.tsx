import { CircularProgress } from "@mui/material";

interface PartialLoaderProps {
    size?: number,
}
export default function PartialLoader({ size = 40}: PartialLoaderProps) {
    return (
        <div className="flex items-center justify-center">
            <CircularProgress size={size} className="text-primary" />
        </div>
    );
}