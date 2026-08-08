import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white text-zinc-950">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link
          href="/"
          className="text-sm text-zinc-500 hover:text-zinc-950"
        >
          ← Back
        </Link>

        <h1 className="mt-8 text-3xl font-semibold tracking-tight">
          Terms of Service
        </h1>

        <p className="mt-3 text-sm text-zinc-500">
          Last updated: August 8, 2026
        </p>

        <div className="mt-10 space-y-8 text-sm leading-7 text-zinc-600">
          <section>
            <h2 className="mb-2 text-base font-semibold text-zinc-950">
              1. Acceptance of Terms
            </h2>
            <p>
              By using CloudShary, you agree to these Terms of Service.
              If you do not agree with these terms, you should not use
              the service.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-zinc-950">
              2. Your Account
            </h2>
            <p>
              You are responsible for maintaining the security of your
              account credentials and for activity performed through
              your account.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-zinc-950">
              3. Uploaded Files
            </h2>
            <p>
              You are responsible for the files you upload and share
              through CloudShary. You must have the necessary rights to
              store and share those files.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-zinc-950">
              4. Prohibited Use
            </h2>
            <p>
              You must not use CloudShary for unlawful activities,
              unauthorized distribution of content, or attempts to
              compromise the service.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-zinc-950">
              5. Service Availability
            </h2>
            <p>
              CloudShary is provided on an as-is basis. Availability and
              functionality may change as the service develops.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-zinc-950">
              6. Account Termination
            </h2>
            <p>
              Accounts may be suspended or terminated if the service is
              abused or these terms are violated.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-zinc-950">
              7. Contact
            </h2>
            <p>
              If you have questions about these terms, contact the
              CloudShary project administrator.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}