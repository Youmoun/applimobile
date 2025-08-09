
import React from 'react'
import { Provider } from '../types'
import { Stars } from './Stars'

export function ProviderCard({ provider, onOpen }: { provider: Provider, onOpen: () => void }) {
  const avg = provider.ratings && provider.ratings.length
    ? (provider.ratings.reduce((a, r) => a + (r?.stars ?? 0), 0) / provider.ratings.length)
    : 0

  return (
    <div className="card p-4 flex gap-4 cursor-pointer hover:shadow-md transition" onClick={onOpen}>
      <img
        src={provider.photo_url || 'https://placehold.co/120x120?text=Photo'}
        alt={`${provider.first_name} ${provider.last_name}`}
        className="h-16 w-16 rounded-xl object-cover"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="truncate font-semibold text-lg">{provider.first_name} {provider.last_name}</div>
          <span className="badge">{provider.city}</span>
        </div>
        <div className="mt-1 text-sm text-gray-500 truncate">
          {provider.categories?.join(' • ')}
        </div>
        <div className="mt-2"><Stars value={avg || 0} /></div>
      </div>
    </div>
  )
}
