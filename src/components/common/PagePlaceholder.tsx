type PagePlaceholderProps = { title: string; description: string };

export function PagePlaceholder({ title, description }: PagePlaceholderProps) {
  return (
    <section className="placeholder">
      <p className="eyebrow">Prototype foundation</p>
      <h1>{title}</h1>
      <p>{description}</p>
    </section>
  );
}
