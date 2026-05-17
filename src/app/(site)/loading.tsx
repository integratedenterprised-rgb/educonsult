import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui/atoms/skeleton";

export default function SiteLoading() {
  return (
    <Container className="py-16">
      <div className="space-y-6">
        <Skeleton className="h-10 w-2/3 max-w-xl" />
        <Skeleton className="h-4 w-full max-w-2xl" />
        <Skeleton className="h-4 w-5/6 max-w-2xl" />
        <div className="grid gap-4 pt-6 md:grid-cols-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    </Container>
  );
}
