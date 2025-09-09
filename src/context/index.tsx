'use client'

import React, { createContext, useContext, useState } from 'react'

type CurrencyContextProviderProps = {
  children: React.ReactNode
}

type CurrencyContext = {
  currency: string
  toggleCurrency: () => void
}

const CurrencyContext = createContext<CurrencyContext | null>(null)

export default function CurrencyContextProvider({
  children,
}: CurrencyContextProviderProps) {
  const [currency, setCurrency] = useState('eur')

  // Initialize currency from localStorage on client side only
  React.useEffect(() => {
    const savedCurrency = localStorage.getItem('currency')
    if (savedCurrency) {
      setCurrency(savedCurrency)
    }
  }, [])

  const toggleCurrency = () => {
    const newCurrency = currency === 'eur' ? 'usd' : 'eur'
    setCurrency(newCurrency)
    localStorage.setItem('currency', newCurrency)
  }

  return (
    <CurrencyContext.Provider value={{ currency, toggleCurrency }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrencyContext() {
  const context = useContext(CurrencyContext)
  if (!context) {
    throw new Error(
      'useCurrencyContext must be used within a CurrencyContextProvider'
    )
  }
  return context
}
