export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto max-w-3xl py-12 px-4">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-muted-foreground mb-4">
        Last updated: December 2, 2025
      </p>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Information We Collect</h2>
        <p>When you connect your Jira account, we access:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Your Jira user profile information</li>
          <li>Project and issue data for linked repositories</li>
        </ul>

        <h2 className="text-xl font-semibold">How We Use Your Information</h2>
        <p>We use this information solely to:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Link pull requests to Jira issues</li>
          <li>Update issue statuses when PRs are merged</li>
          <li>Add comments to issues about PR activity</li>
        </ul>

        <h2 className="text-xl font-semibold">Data Storage</h2>
        <p>
          We store OAuth tokens securely to maintain your connection. We do not
          store your Jira issues or project data.
        </p>

        <h2 className="text-xl font-semibold">Contact</h2>
        <p>For questions, contact: your-email@example.com</p>
      </section>
    </div>
  );
}
