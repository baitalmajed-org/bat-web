export default function SectionHeading({ eyebrow, title, intro, as: Tag = "h2" }: { eyebrow?: string | null; title: string; intro?: string | null; as?: "h1" | "h2" }) {
  return (
    <div className="max-w-2xl">
      {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
      <Tag className="text-3xl sm:text-4xl">{title}</Tag>
      {intro ? <p className="mt-3 text-steel-600">{intro}</p> : null}
    </div>
  );
}
