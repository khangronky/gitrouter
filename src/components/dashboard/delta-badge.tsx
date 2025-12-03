export function DeltaBadge({ delta, note }: { delta: number; note?: string }) {
  const isUp = delta >= 0;
  return (
    <span
      title={note}
      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 font-medium text-xs ${
        isUp
          ? 'text-green-600 dark:text-green-400'
          : 'text-red-600 dark:text-red-400'
      }`}
    >
      {isUp ? '▲' : '▼'} {Math.abs(delta)}%
      {note ? (
        <span className="ml-0.5 font-medium text-foreground text-xs">
          {note}
        </span>
      ) : null}
    </span>
  );
}
