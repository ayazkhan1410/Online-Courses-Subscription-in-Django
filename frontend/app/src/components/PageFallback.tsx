import { Skeleton } from '@/components/Skeleton'

export function PageFallback() {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-16 md:px-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="mt-4 h-4 max-w-md" />
    </div>
  )
}
