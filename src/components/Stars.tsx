import React from 'react'
export function Stars({ value }: { value: number }) {
  const rounded = Math.round(value || 0)
  return (<div className="flex items-center gap-1" aria-label={`Note ${value} sur 5`}>
    {Array.from({ length: 5 }).map((_, i) => (<svg key={i} viewBox="0 0 24 24" className={`h-4 w-4 ${i < rounded ? 'fill-yellow-500' : 'fill-gray-300'}`}><path d="M12 .587l3.668 7.431 8.204 1.192-5.936 5.787 1.402 8.169L12 18.896l-7.338 3.87 1.402-8.169L.128 9.21l8.204-1.192z"/></svg>))}
    <span className="ml-1 text-xs text-gray-500">{(value||0).toFixed(1)}</span></div>)
}
