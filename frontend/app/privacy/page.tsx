import Link from "next/link";

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>

        <p className="mt-3 text-sm text-zinc-500">
          Last updated: August 8, 2026
        </p>

        <div className="mt-10 space-y-8 text-sm leading-7 text-zinc-600">
          <section>
            <h2 className="mb-2 text-base font-semibold text-zinc-950">
              1. Information We Collect
            </h2>
            <p>
              CloudShary may collect information such as your name,
              email address, account information, and files that you
              choose to upload.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-zinc-950">
              2. How We Use Information
            </h2>
            <p>
              Information is used to provide authentication, file
              storage, file sharing, account management, and other
              functionality provided by CloudShary.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-zinc-950">
              3. Uploaded Files
            </h2>
            <p>
              Files uploaded to CloudShary are stored to provide the
              requested storage and sharing functionality. You control
              which files you choose to share.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-zinc-950">
              4. Authentication
            </h2>
            <p>
              Authentication information and tokens may be used to
              maintain your logged-in session and protect your account.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-zinc-950">
              5. Third-Party Services
            </h2>
            <p>
              CloudShary may use third-party infrastructure and services
              to provide hosting, storage, authentication, email, or
              other functionality.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-zinc-950">
              6. Data Security
            </h2>
            <p>
              Reasonable technical measures are used to protect account
              and file data. However, no online service can guarantee
              absolute security.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-zinc-950">
              7. Contact
            </h2>
            <p>
              If you have questions about this Privacy Policy, contact
              the CloudShary project administrator.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}