import Link from "next/link";
import { Button, Card } from "@/components/ui";

export default function BeforeLoginPage() {
  return (
    <div className="space-y-6">
      <h1 className="section-title text-3xl font-bold">Before Login</h1>
      <Card>
        <p className="text-sm text-text-muted">
          Guest mode gives browsing and AI suggestions, while login unlocks full personalization, order history, and wishlist sync.
        </p>
        <div className="mt-4 flex gap-2">
          <Link href="/login"><Button>Login</Button></Link>
          <Link href="/register"><Button variant="ghost">Register</Button></Link>
        </div>
      </Card>
    </div>
  );
}
