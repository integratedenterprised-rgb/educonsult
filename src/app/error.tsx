"use client";

import { useEffect } from "react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/atoms/button";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        We&apos;ve been notified and are looking into it.
      </p>
      <Button onClick={reset} className="mt-6">
        Try again
      </Button>
    </Container>
  );
}
