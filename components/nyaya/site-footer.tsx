import Link from 'next/link';
import { Github, Twitter, Linkedin, Scale } from 'lucide-react';
import { Logo } from '@/components/nyaya/logo';

const footerLinks = {
  Product: [
    { label: 'AI Chat', href: '/chat' },
    { label: 'RTI Generator', href: '/rti' },
    { label: 'Legal Notice', href: '/legal-notice' },
    { label: 'Settings', href: '/settings' },
  ],
  Company: [
    { label: 'About', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Press', href: '#' },
    { label: 'Contact', href: '#' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Disclaimer', href: '#' },
    { label: 'Security', href: '#' },
  ],
};

export function SiteFooter() {
  return (
    <footer className="relative border-t border-border/60 bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              AI-powered legal assistance for every Indian. Understand your rights, draft documents, and get cited answers — in seconds.
            </p>
            <div className="mt-5 flex items-center gap-3">
              {[Twitter, Github, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  aria-label="Social link"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="text-sm font-semibold">{heading}</h4>
              <ul className="mt-4 space-y-2.5">
                {links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border/60 pt-6 sm:flex-row sm:items-center">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Scale className="h-3.5 w-3.5" />
            Nyaya AI provides legal information, not legal advice. No lawyer-client relationship is formed.
          </p>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Nyaya AI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
