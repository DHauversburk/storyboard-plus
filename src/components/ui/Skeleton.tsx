
import React from 'react';

interface SkeletonProps {
    className?: string;
    width?: string | number;
    height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = "", width, height }) => {
    return (
        <div
            className={`bg-white/10 animate-pulse rounded ${className}`}
            style={{
                width: width,
                height: height
            }}
        />
    );
};

export const FileListSkeleton: React.FC = () => {
    return (
        <div className="space-y-2 p-2">
            {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center gap-2">
                    <Skeleton width={16} height={16} className="bg-white/5" />
                    <Skeleton width="80%" height={12} className="bg-white/5" />
                </div>
            ))}
        </div>
    );
};
