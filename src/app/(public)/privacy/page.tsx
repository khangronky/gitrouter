export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 pt-24 pb-12">
      <h1 className="mb-6 font-bold text-3xl">Privacy Policy</h1>
      <p className="mb-4 text-muted-foreground">
        Last updated: December 2, 2025
      </p>

      <section className="space-y-4">
        <h2 className="font-semibold text-xl">Information We Collect</h2>
        <p>When you connect your Jira account, we access:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Your Jira user profile information</li>
          <li>Project and issue data for linked repositories</li>
        </ul>

        <h2 className="font-semibold text-xl">How We Use Your Information</h2>
        <p>We use this information solely to:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>Link pull requests to Jira issues</li>
          <li>Update issue statuses when PRs are merged</li>
          <li>Add comments to issues about PR activity</li>
        </ul>

        <h2 className="font-semibold text-xl">Data Storage</h2>
        <p>
          We store OAuth tokens securely to maintain your connection. We do not
          store your Jira issues or project data.
        </p>

        <h2 className="font-semibold text-xl">Contact</h2>
        <p>For questions, contact: your-email@example.com</p>
      </section>
    </div>
  );
}
