import React from 'react';

interface SkeletonProps {
    className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
    <div
        className={`animate-pulse bg-white/10 rounded ${className}`}
        aria-hidden="true"
    />
);

export const FileListSkeleton: React.FC = () => (
    <div className="space-y-2 p-2" role="status" aria-label="Loading files">
        {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-2">
                <Skeleton className="w-5 h-5 rounded" />
                <Skeleton className="flex-1 h-4" />
            </div>
        ))}
        <span className="sr-only">Loading files...</span>
    </div>
);

export const StatsSkeleton: React.FC = () => (
    <div className="space-y-3" role="status" aria-label="Loading statistics">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-28" />
        <span className="sr-only">Loading statistics...</span>
    </div>
);
