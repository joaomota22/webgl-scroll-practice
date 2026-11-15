import { FINISHES, type Finish } from '@/lib/story';

type Props = {
  /** Nome do grupo de rádio; tem de ser único por instância na página. */
  name: string;
  value: Finish;
  onChange: (finish: Finish) => void;
  className?: string;
};

/**
 * Seletor de acabamento com botões de rádio nativos:
 * navegação por setas e anúncio em leitores de ecrã sem ARIA manual.
 */
export default function FinishPicker({ name, value, onChange, className = '' }: Props) {
  return (
    <fieldset className={`flex gap-4 ${className}`}>
      <legend className="sr-only">Acabamento</legend>
      {FINISHES.map((finish) => (
        <label key={finish.id} title={finish.name} className="pointer-events-auto relative cursor-pointer">
          <input
            type="radio"
            name={name}
            value={finish.id}
            checked={finish.id === value.id}
            onChange={() => onChange(finish)}
            className="peer sr-only"
          />
          <span
            aria-hidden
            style={{ backgroundColor: finish.body }}
            className="block size-[34px] rounded-full border border-white/25 ring-offset-[3px] ring-offset-[#15161a] transition-[box-shadow,scale] duration-300 hover:scale-110 peer-checked:ring-2 peer-checked:ring-fg peer-focus-visible:outline-2 peer-focus-visible:outline-offset-[7px] peer-focus-visible:outline-accent"
          />
          <span className="sr-only">{finish.name}</span>
        </label>
      ))}
    </fieldset>
  );
}
