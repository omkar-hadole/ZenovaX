import { GraduationCap, Lightbulb, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';

const roles = [
  {
    icon: GraduationCap,
    role: 'For learners',
    title: 'Answers at peer speed',
    body: 'Rapid access to focused human explanations at a fraction of the cost of professional tutoring, reinforced immediately in the coding playground.',
    points: ['Topic-wise micro sessions', 'Affordable or free seats', 'Practice right after learning'],
  },
  {
    icon: Lightbulb,
    role: 'For mentors',
    title: 'Teach, earn, get verified',
    body: 'Turn knowledge into income while building a public portfolio. Ratings and completed sessions unlock badges from Bronze to Verified.',
    points: ['Monetize your skills', 'Launch live quizzes and challenges', 'Build teaching credentials'],
  },
  {
    icon: Building2,
    role: 'For communities',
    title: 'A self-sustaining network',
    body: 'Campus communities get a peer support network that eases the load on teaching assistants, with admin moderation keeping quality high.',
    points: ['Admin-audited sessions', 'Moderation and reporting tools', 'QR-verified offline meetups'],
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function TestimonialsSection() {
  return (
    <section className="relative bg-bg-subtle py-28">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          className="text-center max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <p className="text-sm font-semibold tracking-widest uppercase text-accent">
            Built for every role
          </p>
          <h2 className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight text-text">
            One platform,
            <span className="text-text-subtle"> three ways to win.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {roles.map(({ icon: Icon, role, title, body, points }, i) => (
            <motion.article
              key={role}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              whileHover={{ y: -6 }}
              className="group relative rounded-3xl border border-border bg-surface p-8 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:border-border-accent transition-shadow duration-300"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent-tint border border-border-accent">
                <Icon className="w-5 h-5 text-accent" aria-hidden="true" />
              </div>
              <p className="mt-5 text-xs font-semibold tracking-widest uppercase text-text-subtle">
                {role}
              </p>
              <h3 className="mt-2 text-xl font-semibold text-text">{title}</h3>
              <p className="mt-3 text-text-muted leading-relaxed">{body}</p>
              <ul className="mt-6 space-y-2 list-none">
                {points.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-sm text-text">
                    <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent" />
                    {p}
                  </li>
                ))}
              </ul>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
