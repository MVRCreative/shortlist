import { Price } from '@/components/shortlist/price'
import { deliveryLine, getTier, planDetail } from '@/lib/shortlist/pricing'
import { channelLabels, type DigestSettings } from '@/lib/shortlist/schemas'

/** Quiet read-only plan view — opened from account chrome, not primary nav. */
export function DigestSettingsPanel({ settings }: { settings: DigestSettings }) {
  const tier = getTier(settings.tier)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <p className="text-label-sm">{tier.name}</p>
          <p className="text-paragraph-xs">{planDetail(settings)}</p>
        </div>
        <Price amount={tier.price} />
      </div>
      <p className="text-paragraph-sm text-pretty">{deliveryLine(settings)}</p>
      <div className="flex flex-col gap-1">
        <p className="text-paragraph-xs">Delivery</p>
        <p className="text-paragraph-sm">{settings.email || 'No email set'}</p>
      </div>
      {settings.channels.length > 0 ? (
        <div className="flex flex-col gap-1">
          <p className="text-paragraph-xs">Channels</p>
          <ul className="flex flex-col gap-0.5">
            {settings.channels.map((channel) => (
              <li key={channel} className="text-paragraph-sm">
                {channelLabels[channel]}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <p className="text-paragraph-xs text-pretty">
        Plan changes aren’t in this prototype. Sign out to restart setup if you need a different tier.
      </p>
    </div>
  )
}
