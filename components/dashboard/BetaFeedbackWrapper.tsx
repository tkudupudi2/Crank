'use client'

import { useBetaFeedback } from '@/hooks/useBetaFeedback'
import BetaFeedbackModal from './BetaFeedbackModal'

export default function BetaFeedbackWrapper() {
  const { showModal, handleClose } = useBetaFeedback()

  return (
    <BetaFeedbackModal
      isOpen={showModal}
      onClose={handleClose}
    />
  )
}
