import { Skeleton } from '@/components/ui/skeleton'

export function StepSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-busy="true" aria-label="Loading">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <div className="flex flex-col gap-5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-10 w-full rounded-10" />
          </div>
        ))}
      </div>
      <Skeleton className="h-10 w-36 rounded-10" />
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-8 px-4 pt-8 pb-16 sm:px-6" aria-busy="true" aria-label="Loading">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="size-8 rounded-full" />
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-2/3 max-w-sm" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <div className="flex flex-col gap-3">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-20" />
        ))}
      </div>
    </div>
  )
}
