import { Check } from "lucide-react";
import { AgentTemplate } from "@/lib/types";
import { TemplateIcon } from "@/components/icons";

interface Props {
  template: AgentTemplate;
  selected?: boolean;
  onSelect?: () => void;
}

export default function TemplateCard({ template, selected, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`card group w-full p-4 text-left transition hover:-translate-y-0.5 hover:shadow-pop ${
        selected ? "ring-2 ring-brand-500" : ""
      }`}
    >
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-600/20">
        <TemplateIcon templateId={template.id} />
      </span>
      <div className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
        {template.name}
      </div>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">
        {template.description}
      </p>
      {selected && (
        <span className="pill mt-3 bg-brand-50 text-brand-700">
          <Check className="h-3 w-3" /> Selected
        </span>
      )}
    </button>
  );
}
