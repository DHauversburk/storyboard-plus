import { SmartEditor } from "@/components/editor/SmartEditor";

export default function WritePage({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined }
}) {
    const sceneId = typeof searchParams.sceneId === 'string' ? searchParams.sceneId : undefined;

    return (
        <div className="h-full w-full overflow-hidden">
            <SmartEditor initialContent="" sceneId={sceneId} />
        </div>
    );
}
