import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

const FOOTER_COLUMNS: Array<{ title: string; links: Array<{ label: string; href: string }> }> = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "How it works", href: "/#how-it-works" },
      { label: "Pricing", href: "/#pricing" },
      { label: "FAQ", href: "/#faq" },
    ],
  },
  {
    title: "Get started",
    links: [
      { label: "Sign up", href: "/signup" },
      { label: "Sign in", href: "/login" },
      { label: "Features", href: "/#features" },
    ],
  },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-subtle/60">
      <div className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
          <div className="max-w-sm">
            <Link href="/" aria-label="ATLARIS home">
              <Logo size={30} animated={false} />
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              ATLARIS is a local-first analytics dashboard. All records are
              stored in your browser and never leave this device.
            </p>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="text-sm font-semibold text-foreground">{column.title}</h2>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-muted-foreground" suppressHydrationWarning>
            © {year} ATLARIS. Demo application — no real payments or accounts.
          </p>
          <p className="text-xs text-muted-foreground">
            Data lives in <code className="font-mono">localStorage</code> under{" "}
            <code className="font-mono">atlaris_*</code>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
