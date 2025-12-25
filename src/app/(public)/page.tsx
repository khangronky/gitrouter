
import { BentoGrid } from '@/components/landing/bento-grid';
import { BentoCell } from '@/components/landing/bento-cell';
import { Hero } from '@/components/landing/hero';
import { AboutSection } from '@/components/landing/about-section';
import { CTASection } from '@/components/landing/cta-section';

import {
  RoutingCell,
  RulesCell,
  AnalyticsCell,
  GitHubCell,
  SlackCell,
  JiraCell,
  EscalationCell,
  TeamCell,
} from '@/components/landing/cells';

export default function LandingPage() {
  return (
    <>
      <Hero />

      <BentoGrid>
        {/* Row 1 */}
        <BentoCell
          size="xl"
          title="The Right Reviewer, Every Time"
          description="Intelligent routing with sub-100ms performance"
          delay={0}
          className="lg:col-span-2 lg:row-span-2"
        >
          <RoutingCell />
        </BentoCell>

        <BentoCell
          size="md"
          title="Build Rules Without Code"
          description="Drag-and-drop rule builder"
          delay={100}
          className="lg:col-span-1 lg:row-span-2"
        >
          <RulesCell />
        </BentoCell>

        <BentoCell
          size="sm"
          title="GitHub Native"
          description="Seamless integration"
          delay={200}
          className="lg:col-span-1"
        >
          <GitHubCell />
        </BentoCell>

        {/* Row 2 - GitHub cell continues, Slack starts */}
        <BentoCell
          size="sm"
          title="Instant Alerts"
          description="Slack notifications"
          delay={300}
          className="lg:col-span-1"
        >
          <SlackCell />
        </BentoCell>

        {/* Row 3 */}
        <BentoCell
          size="lg"
          title="Data-Driven Insights"
          description="Track review latency, SLA compliance, and team workload"
          delay={400}
          className="lg:col-span-2"
        >
          <AnalyticsCell />
        </BentoCell>

        <BentoCell
          size="md"
          title="Jira Sync"
          description="Bidirectional ticket linking"
          delay={500}
          className="lg:col-span-2"
        >
          <JiraCell />
        </BentoCell>

        {/* Row 4 */}
        <BentoCell
          size="md"
          title="Never Miss a Review"
          description="Automated escalation policies"
          delay={600}
          className="lg:col-span-2"
        >
          <EscalationCell />
        </BentoCell>

        <BentoCell
          size="md"
          title="Org-Wide Control"
          description="Multi-team management"
          delay={700}
          className="lg:col-span-2"
        >
          <TeamCell />
        </BentoCell>
      </BentoGrid>

      <AboutSection />
      
      <CTASection />
    </>
  );
}
