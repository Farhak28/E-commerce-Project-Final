import Link from "next/link";
import { Button, Card } from "@/components/ui";

export default function AfterLoginPage() {
  return (
    <div className="space-y-6">
      <h1 className="section-title text-3xl font-bold">After Login</h1>
      <Card>
        <p className="text-sm text-text-muted">
          Personalized dashboard is active: recommendations, saved addresses, loyalty rewards, and complete account controls.
        </p>
        <div className="mt-4 flex gap-2">
          <Link href="/account/dashboard"><Button>Go to dashboard</Button></Link>
          <Link href="/wishlist"><Button variant="ghost">Open wishlist</Button></Link>
        </div>
      </Card>
    </div>
  );
}
