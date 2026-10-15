import { ChannelIcon } from "@/components/interactions/channel-icon"
import { RelativeDate } from "@/components/shared/relative-date"
import type { Interaction } from "@/lib/api/types"
import { CHANNEL_LABELS } from "@/lib/labels"

export function InteractionTimeline({ interactions }: { interactions: Interaction[] }) {
  if (interactions.length === 0) {
    return <p className="text-pizarra">Aún no hay contactos registrados. Registra el primero arriba.</p>
  }
  return (
    <ol className="flex flex-col">
      {interactions.map((interaction, index) => (
        <li key={interaction.id} className="relative flex gap-3 pb-5 last:pb-0">
          {index < interactions.length - 1 && (
            <span aria-hidden className="absolute top-9 bottom-1 left-[17px] w-px bg-linea" />
          )}
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-linea bg-card">
            <ChannelIcon channel={interaction.contact_channel} />
          </span>
          <div className="min-w-0 flex-1 pt-1.5">
            <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
              <span className="font-semibold text-tinta">{CHANNEL_LABELS[interaction.contact_channel]}</span>
              <span className="text-xs text-pizarra">
                {interaction.user.name}, <RelativeDate value={interaction.created_at} />
              </span>
            </p>
            {interaction.what_happened && (
              <p className="mt-1 whitespace-pre-line break-words text-tinta">{interaction.what_happened}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}
