const topics = [
  'Advanced React Patterns',
  'Reverse a Linked List',
  'System Design Basics',
  'SQL Joins Deep-Dive',
  'Dynamic Programming',
  'Git & PR Workflows',
  'REST API Design',
  'Recursion Drills',
  'Placement Interview Prep',
  'Binary Trees',
  'CSS Layout Mastery',
  'OS Fundamentals',
];

function TopicRow({ hidden = false }) {
  return (
    <ul
      aria-hidden={hidden || undefined}
      className="flex items-center gap-3 pr-3 list-none m-0 p-0"
    >
      {topics.map((topic) => (
        <li key={topic} className="flex items-center gap-3 whitespace-nowrap">
          <span className="px-4 py-1.5 rounded-full border border-border bg-surface text-sm text-text-muted">
            {topic}
          </span>
          <span aria-hidden="true" className="h-1 w-1 rounded-full bg-accent-soft" />
        </li>
      ))}
    </ul>
  );
}

/**
 * Infinite side-scrolling strip of real session-topic examples, shown right
 * under the hero. Two copies of the row loop via the .marquee-track CSS
 * animation (the duplicate is aria-hidden); hover pauses, reduced motion
 * disables the animation entirely and the first row simply overflows.
 */
export default function TopicMarquee() {
  return (
    <section
      aria-label="Example session topics"
      className="relative border-y border-border bg-bg-subtle/60 py-5 overflow-hidden marquee-mask"
    >
      <div className="marquee-track">
        <TopicRow />
        <TopicRow hidden />
      </div>
    </section>
  );
}
