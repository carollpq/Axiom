const COURSES = [
  {
    title: "Constructive Peer Review",
    desc: "Learn to write actionable, evidence-based reviews that help authors improve their work.",
    tag: "Fundamentals",
  },
  {
    title: "Statistical Review Methods",
    desc: "Evaluate methodology, sample sizes, and statistical claims with confidence.",
    tag: "Advanced",
  },
  {
    title: "Ethics in Peer Review",
    desc: "Navigate conflicts of interest, bias, and confidentiality in the review process.",
    tag: "Ethics",
  },
  {
    title: "Reviewing Replication Studies",
    desc: "Special considerations for evaluating replication and negative-result papers.",
    tag: "Specialized",
  },
];

export function CoursesCarousel() {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-bold mb-3 px-1" style={{ color: "#d4ccc0" }}>
        Recommended Courses
      </h3>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {COURSES.map((course) => (
          <div
            key={course.title}
            className="shrink-0 rounded-lg p-4 w-64 border transition-colors hover:border-[#c9a44a]/40"
            style={{
              backgroundColor: "rgba(120,110,95,0.15)",
              borderColor: "rgba(180,160,130,0.2)",
            }}
          >
            <span
              className="inline-block text-[10px] uppercase tracking-wider px-2 py-0.5 rounded mb-2"
              style={{ backgroundColor: "rgba(201,164,74,0.15)", color: "#c9a44a" }}
            >
              {course.tag}
            </span>
            <div className="text-sm font-serif mb-1" style={{ color: "#e8e0d4" }}>
              {course.title}
            </div>
            <div className="text-[11px] leading-relaxed" style={{ color: "#8a8070" }}>
              {course.desc}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
