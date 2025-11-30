export function DeltaBadge({ delta, note }: { delta: number; note?: string }) {
  const isUp = delta >= 0;
  return (
    <span
      title={note}
      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 font-medium text-[10px] ${
        isUp
          ? 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400'
          : 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400'
      }`}
    >
      {isUp ? '▲' : '▼'} {Math.abs(delta)}%
      {note ? (
        <span className="ml-0.5 font-normal text-muted-foreground">{note}</span>
      ) : null}
    </span>
  );
}
