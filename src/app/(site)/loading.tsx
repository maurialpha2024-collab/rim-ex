import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Shown while any page in the site is loading: header, toggle, then a few card skeletons.
export default function Loading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-14 w-full rounded-card sm:max-w-md" />
      <ul className="flex flex-col gap-3">
        {[0, 1, 2, 3].map((i) => (
          <li key={i}>
            <Card className="grid gap-4 p-5 md:grid-cols-[1.15fr_1fr_auto] md:items-center md:gap-6">
              <div className="flex items-start gap-3">
                <Skeleton className="h-11 w-11 rounded-full" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Skeleton className="h-7 w-40" />
                <Skeleton className="h-4 w-56" />
              </div>
              <Skeleton className="h-10 w-full md:w-44" />
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
