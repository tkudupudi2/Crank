'use client'

import { useState, useEffect } from 'react'

export function useBetaFeedback() {
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    // Show modal after a short delay to let the page load
    const timer = setTimeout(() => {
      setShowModal(true)
    }, 2000)
    
    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setShowModal(false)
  }

  const resetFeedback = () => {
    // Allow showing the modal again (useful for testing)
    setShowModal(true)
  }

  return {
    showModal,
    handleClose,
    resetFeedback
  }
}
