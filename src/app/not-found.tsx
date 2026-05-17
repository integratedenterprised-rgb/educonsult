import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/atoms/button";

export default function NotFound() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">404</p>
      <h1 className="mt-2 font-heading text-4xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        The page you&apos;re looking for has been moved or no longer exists.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">Back to home</Link>
      </Button>
    </Container>
  );
}
