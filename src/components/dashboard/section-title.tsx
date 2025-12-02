export function SectionTitle({
  children,
  right,
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h3 className="font-semibold text-foreground text-sm">{children}</h3>
      {right}
    </div>
  );
}
